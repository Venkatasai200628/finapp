import { Redirect } from 'expo-router';

/** Bank linking is the CSV upload on Books. SMS is not used in production. */
export default function ConnectPaymentsRedirect() {
  return <Redirect href="/import-statement" />;
}
