const API_URL = '/api/send-email';

export interface NotificationData {
  rfq_number?: string;
  client_name?: string;
  description?: string;
  required_date?: string;
  quote_number?: string;
  quote_value_excl?: string | number;
  quoter_name?: string;
  order_number?: string;
  job_number?: string;
}

export type NotificationTemplate =
  | 'rfq_received'
  | 'estimator_assigned'
  | 'quote_ready'
  | 'quote_signoff_request'
  | 'quote_signoff_confirmed'
  | 'order_won'
  | 'job_created';

export async function sendNotification(
  to: string | string[],
  template: NotificationTemplate,
  data: NotificationData
): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, template, data }),
    });
    const result = await response.json();
    if (result.success) {
      console.log(`[Email] ${template} sent OK - id: ${result.id}`);
      return true;
    }
    console.error(`[Email] ${template} failed:`, result.error);
    return false;
  } catch (err) {
    console.error('[Email] sendNotification error:', err);
    return false;
  }
}
