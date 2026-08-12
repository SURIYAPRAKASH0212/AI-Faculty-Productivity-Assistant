from fastapi import APIRouter, HTTPException, status
from models import UserRegisterRequest, UserLoginRequest
from database import db_register_user, db_verify_user

router = APIRouter()

@router.post("/register")
async def register_user(request: UserRegisterRequest):
    try:
        user = db_register_user(
            name=request.name,
            email=request.email,
            password=request.password,
            department=request.department
        )
        return {
            "status": "success",
            "message": "User registered successfully.",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login_user(request: UserLoginRequest):
    user = db_verify_user(email=request.email, password=request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # Return user profile along with a mock token
    return {
        "status": "success",
        "message": "Login successful.",
        "user": user,
        "token": f"mock-jwt-token-{user['id']}-{user['email']}"
    }
