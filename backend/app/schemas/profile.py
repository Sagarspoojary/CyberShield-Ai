from pydantic import BaseModel

class ProfileResponse(BaseModel):
    uid: str
    displayName: str
    email: str
    role: str
    status: str
