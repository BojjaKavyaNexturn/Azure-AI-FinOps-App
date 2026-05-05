import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_anomaly_explanation(vm_id: str, meta: dict) -> dict:
    """Use Groq (LLaMA3) to generate explanation and recommended actions."""

    prompt = f"""You are a senior Azure FinOps engineer writing a client-facing anomaly report. Be concise, specific, and professional.

Anomaly:
- VM: {vm_id}
- Type: {meta['title']}
- Flag: {meta['flag']}
- Severity: {meta['severity']}
- Period: {meta['dates']}
- Owner: {meta['owner']}
- Monthly Saving if Fixed: ${meta['saving']}
- Confidence: {int(meta['confidence'] * 100)}%

Respond with JSON with exactly these 4 keys:
1. "explanation" — exactly 2 sentences. Sentence 1: What happened with specific numbers (cost, dates, VM). Sentence 2: Why this matters financially.
2. "root_cause" — exactly 1 sentence. The single most specific technical cause (not generic like 'misconfiguration').
3. "actions" — exactly 3 items. Each 8-12 words. Start with action verb. Be specific to this VM, dates, and anomaly type.
4. "alternative" — exactly 1 sentence. A cost-saving alternative approach if the root cause cannot be fixed immediately.
5. "confidence_note" — exactly 1 sentence. Explain what the {int(meta['confidence'] * 100)}% confidence score means for this specific anomaly and how reliable this detection is.

Example of GOOD actions:
- "Filter Billing_Data vm-05 Jan 03-05, compare CostUSD vs NetworkIn_MB"
- "Alert SearchTeam: billing spike detected on vm-05, investigate network jobs"
- "Review and cancel unrecognised background network transfers on vm-05"

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