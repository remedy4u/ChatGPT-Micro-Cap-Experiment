export default function Page() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>RepairAI Guard — Admin Dashboard (MVP)</h1>
      <ul>
        <li>Inbound calls: API /webhooks/twilio/voice</li>
        <li>Leads and quotes: API /leads + /quotes/preview</li>
        <li>Reminders: API /reminders/schedule</li>
        <li>Analytics: API /dashboard/summary</li>
      </ul>
      <p>Sandbox mode is enabled via SANDBOX_MODE=true.</p>
    </main>
  );
}
