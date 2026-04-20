# API spec (MVP)

## POST /webhooks/twilio/voice
Inbound telephony callback.

Input (json):
- `CallSid` string (required)
- `From` string
- `applianceType` string
- `brand` string
- `model` string
- `symptom` string
- `urgency` string
- `lang` string
- `address` string

Output:
- `lead`
- `quote`
- `twiml`

## POST /leads
Create lead manually.

## GET /leads
List captured leads.

## POST /quotes/preview
Body: `{ "leadId": "..." }`

## POST /reminders/schedule
Body: `{ "appointmentId": "..." }`

## GET /dashboard/summary
Returns baseline analytics summary.
