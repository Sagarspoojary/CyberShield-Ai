from fastapi import APIRouter
from app.schemas.profile import ProfileResponse

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile():
    """
    Get operator profile information.
    """
    return ProfileResponse(
        uid="op-9948271",
        displayName="Cyber Operator",
        email="operator@cybershield.ai",
        role="Lead SOC Analyst",
        status="Active"
    )
