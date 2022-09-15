import SignUpForm from "../components/SignUpForm";
import OneLineForm from "../components/OneLineForm";

export default function Meetings() {
  return (
    <>
      <h3>Knoodle configurations</h3>
      <p>Change contacts URL:</p>
      <OneLineForm id="url" label="URL" />
      <p>
        Don't have an availability calendar yet? Allow knoodle to fetch
        availability calendar from google and store it into your pod:
      </p>
      <p>
        1. Enter your email and password used to login to allow the orchestrator
        have access to your pod:
      </p>
      <SignUpForm />
      <p>
        2. Enter your secret address in iCal format:
        (https://support.google.com/calendar/answer/37648#private&zippy=%2Cget-your-calendar-view-only)
      </p>
      <OneLineForm id="secret" label="Secret Address" />
    </>
  );
}
