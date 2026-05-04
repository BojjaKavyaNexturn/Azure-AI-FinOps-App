import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_anomaly_explanation(vm_id: str, meta: dict) -> dict:
    """Use Groq (LLaMA3) to generate explanation and recommended actions."""

    prompt = f"""You are a senior Azure FinOps engineer analyzing cloud cost anomalies.

Anomaly details:
- VM: {vm_id}
- Anomaly Type: {meta['title']}
- Anomaly Flag: {meta['flag']}
- Severity: {meta['severity']}
- Detection Period: {meta['dates']}
- Owner Team: {meta['owner']}
- Estimated Monthly Saving if Fixed: ${meta['saving']}
- Statistical Confidence: {int(meta['confidence'] * 100)}%

Respond with a JSON object containing exactly these 3 keys:
1. "explanation" — A clear 3-4 sentence professional explanation of what this anomaly means, why it matters financially, and what the data pattern looks like.
2. "root_cause" — 2 sentences explaining the most likely technical root cause.
3. "actions" — A list of exactly 3 specific, actionable steps the team should take to investigate and resolve this anomaly. Each action should be one clear sentence.

Return only valid JSON, no markdown, no backticks."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
        )
        content = response.choices[0].message.content.strip()
        content = content.removeprefix("```json").removesuffix("```").strip()
        return json.loads(content)
    except Exception as e:
        print(f"[Groq Error] {e}")
        return {
            "explanation": meta.get("explanation", "No explanation available."),
            "root_cause": "Could not generate AI root cause analysis.",
            "actions": [
                meta.get("action_audit", "Audit billing data."),
                meta.get("action_email", "Alert the VM owner."),
                meta.get("action_fix", "Apply recommended fix."),
            ]
        }