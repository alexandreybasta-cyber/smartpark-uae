from fastapi import APIRouter
from schemas import AgentTextRequest, AgentTextResponse
from agent import process_agent_request

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/text", response_model=AgentTextResponse)
async def agent_text(request: AgentTextRequest):
    """Process text input through the AI agent."""
    return await process_agent_request(request)
