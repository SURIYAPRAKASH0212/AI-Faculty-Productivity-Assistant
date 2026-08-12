import os
import json
import logging
from typing import get_origin, get_args, List, Union
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError

# Initialize logging
logger = logging.getLogger("gemini_client")
logging.basicConfig(level=logging.INFO)

load_dotenv()

class GeminiException(Exception):
    """Base exception for Gemini client errors."""
    pass

class GeminiRateLimitException(GeminiException):
    """Exception raised when the Gemini API returns a rate limit error (429)."""
    pass

class GeminiSafetyException(GeminiException):
    """Exception raised when content is blocked by the safety filters."""
    pass

# Load API key and configure genai
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY is not set in environment variables.")

genai.configure(api_key=api_key or "")

# Load configuration for model
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")

def get_field_schema(annotation, description=None) -> dict:
    schema = {}
    if description:
        schema["description"] = description

    # Handle Optional/Union types (e.g. Union[str, None] or str | None)
    origin = get_origin(annotation)
    args = get_args(annotation)
    
    if origin is not None and ("Union" in str(origin) or "UnionType" in str(origin)):
        # Filter out NoneType/NULL from args
        non_none_args = [a for a in args if a is not type(None)]
        if non_none_args:
            # Recurse on the first non-None type
            return get_field_schema(non_none_args[0], description)

    # Base types mapping
    if annotation == str:
        schema["type"] = "STRING"
    elif annotation == int:
        schema["type"] = "INTEGER"
    elif annotation == float:
        schema["type"] = "NUMBER"
    elif annotation == bool:
        schema["type"] = "BOOLEAN"
    elif origin == list or annotation == list or origin == List:
        schema["type"] = "ARRAY"
        item_annotation = args[0] if args else str
        schema["items"] = get_field_schema(item_annotation)
    elif hasattr(annotation, "model_fields"):
        # Nested Pydantic model
        schema["type"] = "OBJECT"
        properties = {}
        required = []
        for name, field in annotation.model_fields.items():
            field_annotation = field.annotation
            properties[name] = get_field_schema(field_annotation, field.description)
            
            is_req = True
            if hasattr(field, "is_required"):
                is_req = field.is_required()
            elif field.default is not None or field.default_factory is not None:
                is_req = False
            
            if is_req:
                required.append(name)
                
        schema["properties"] = properties
        if required:
            schema["required"] = required
    else:
        # Fallback to string if unknown type
        schema["type"] = "STRING"

    return schema

def pydantic_to_gemini_schema(model_class) -> dict:
    """
    Translates a Pydantic model class into a raw OpenAPI-style schema dictionary
    compatible with the Google Gemini API (without references or $defs).
    """
    if not hasattr(model_class, "model_fields"):
        return model_class  # return as-is if already a dict or not a Pydantic model
        
    return get_field_schema(model_class)

def resolve_union(annotation):
    """Recursively unpacks Optional and Union types to find the concrete underlying type."""
    origin = get_origin(annotation)
    args = get_args(annotation)
    if origin is not None and ("Union" in str(origin) or "UnionType" in str(origin)):
        non_none_args = [a for a in args if a is not type(None)]
        if non_none_args:
            return resolve_union(non_none_args[0])
    return annotation

def clean_parsed_json(data, annotation):
    """
    Recursively inspects the parsed JSON data against its Pydantic model annotation
    to fix common Gemini model anomalies (like stringified JSON arrays).
    """
    # Resolve Optionals/Unions
    annotation = resolve_union(annotation)
    origin = get_origin(annotation)
    args = get_args(annotation)

    # If it is a Pydantic model
    if hasattr(annotation, "model_fields"):
        if not isinstance(data, dict):
            return data
        for name, field in annotation.model_fields.items():
            if name in data:
                val = data[name]
                field_type = field.annotation
                
                # Check if it's expected to be a list but we got a string
                resolved_field_type = resolve_union(field_type)
                field_origin = get_origin(resolved_field_type)
                if (resolved_field_type == list or field_origin == list or field_origin == List) and isinstance(val, str):
                    stripped = val.strip()
                    if stripped.startswith("[") and stripped.endswith("]"):
                        try:
                            # Try to parse string as JSON list
                            data[name] = json.loads(stripped)
                        except Exception:
                            pass
                
                # Recurse
                data[name] = clean_parsed_json(data[name], field_type)
        return data

    # If it is a list
    elif (origin == list or annotation == list or origin == List) and isinstance(data, list):
        item_annotation = args[0] if args else str
        return [clean_parsed_json(item, item_annotation) for item in data]

    return data


async def ask_gemini(
    system_instruction: str,
    user_prompt: str,
    response_mime_type: str = "text/plain",
    response_schema = None
) -> str:
    """
    Sends a prompt to the Google Gemini API with system instructions and optional JSON schema constraints.
    
    Args:
        system_instruction: Guidelines for the model's behavior and persona.
        user_prompt: The input prompt from the user/agent.
        response_mime_type: Mime type of the response (e.g. "text/plain" or "application/json").
        response_schema: Optional Pydantic model class for structured JSON output constraints.
        
    Returns:
        The string output from Gemini (which will be valid JSON if application/json is specified).
        
    Raises:
        GeminiRateLimitException: If API limit is exhausted (429).
        GeminiSafetyException: If prompt/output is flagged.
        GeminiException: For other SDK or validation failures.
    """
    if not api_key:
        raise GeminiException("GEMINI_API_KEY is missing. Please configure it in your .env file.")

    try:
        # Instantiate GenerativeModel
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction
        )

        # Configure generation parameters
        generation_config = genai.GenerationConfig(
            response_mime_type=response_mime_type,
            response_schema=pydantic_to_gemini_schema(response_schema) if response_schema else None
        )

        logger.info(f"Calling Gemini API using model: {MODEL_NAME}")
        # Run the API call asynchronously
        response = await model.generate_content_async(
            user_prompt,
            generation_config=generation_config
        )

        # Check prompt feedback for blocks
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            block_reason = getattr(response.prompt_feedback, 'block_reason', None)
            if block_reason:
                logger.error(f"Prompt blocked. Reason: {block_reason}")
                raise GeminiSafetyException("Content was flagged, please rephrase")

        # Check candidates
        if not response.candidates:
            logger.error("No candidates returned from Gemini API.")
            raise GeminiSafetyException("Content was flagged, please rephrase")

        candidate = response.candidates[0]
        finish_reason = getattr(candidate, 'finish_reason', None)
        if finish_reason:
            # check safety finish reasons
            finish_reason_name = getattr(finish_reason, 'name', str(finish_reason))
            if finish_reason_name in ("SAFETY", "3"):
                logger.error("Response blocked due to safety flags.")
                raise GeminiSafetyException("Content was flagged, please rephrase")

        # Retrieve text
        text_content = response.text
        if not text_content:
            raise GeminiException("Empty response received from the model.")

        # If schema-constrained JSON is requested, validate the shape before returning
        if response_mime_type == "application/json" and response_schema is not None:
            try:
                # Parse to ensure it is valid JSON
                parsed_json = json.loads(text_content)
                # Clean any stringified array anomalies (common in Gemini structured generation)
                parsed_json = clean_parsed_json(parsed_json, response_schema)
                # If a Pydantic model is supplied, validate it
                if hasattr(response_schema, "model_validate"):
                    response_schema.model_validate(parsed_json)
                elif hasattr(response_schema, "validate"):
                    response_schema.validate(parsed_json)
                # Save the cleaned, validated JSON back to text_content
                text_content = json.dumps(parsed_json)

            except Exception as val_err:
                logger.error(f"Schema validation failure on output: {text_content}. Error: {str(val_err)}")
                raise GeminiException(f"Failed to validate JSON response schema: {str(val_err)}")

        return text_content

    except GoogleAPIError as api_err:
        err_msg = str(api_err)
        logger.error(f"Google API Error: {err_msg}")
        
        # Identify rate limits
        if "429" in err_msg or "ResourceExhausted" in err_msg or "rate limit" in err_msg.lower():
            raise GeminiRateLimitException("API rate limit exceeded. Please retry in a moment.")
        
        # Identify safety block
        if "safety" in err_msg.lower() or "blocked" in err_msg.lower():
            raise GeminiSafetyException("Content was flagged, please rephrase")
            
        raise GeminiException(f"Gemini API error: {err_msg}")

    except GeminiException:
        raise

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise GeminiException(f"An unexpected error occurred: {str(e)}")
