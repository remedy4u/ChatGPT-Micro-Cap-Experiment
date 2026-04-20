# Architecture

## Must Have implemented

- Inbound call intake via `POST /webhooks/twilio/voice`
- Lead creation and normalization
- Rules-based quote engine
- Reminder scheduling API
- Admin dashboard skeleton
- Sandbox-first mode

## Should Have scaffolded

- Provider abstraction points (telephony/messaging/calendar/crm planned via modules)
- Worker process scaffold for queue-driven reminders/dispatch

## Later flags

- AI diagnosis from images/audio
- Route optimization
- Parts sync and upsell engine

## Provider abstractions (target contracts)

- `telephony_provider` = Twilio (webhook in place)
- `messaging_provider` = Twilio SMS (to be wired in worker)
- `calendar_provider` = Google Calendar + mock (adapter placeholder)
- `crm_provider` = generic webhook + mock (adapter placeholder)
- `stt_provider`, `tts_provider`, `llm_provider` = interface-first planned
