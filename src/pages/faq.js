import Head from "next/head";

export default function Faq() {
  return (
    <>
      <Head>
        <meta name="description" content="Calendar using solid protocol" />
        <title>KNoodle | Frequently Asked Questions</title>
      </Head>

      <div id="header">
        <h1>🍜 Frequently Asked Questions</h1>
      </div>

      <div>
        <h2>Setting up availability calendar</h2>
        <div id="availability-calendar-webid">
          <h3>Configuring your WebID</h3>
          <p>
            Your WebID needs to point to your availability calendar using the{" "}
            <code>
              https://data.knows.idlab.ugent.be/person/office/#hasAvailabilityCalendar
            </code>
            . For example, this is what you find in Pieter Heyvaert's WebID.
          </p>

          <pre>
            {`@prefix knows: &lt;https://data.knows.idlab.ugent.be/person/office/#> .
          @prefix schema: &lt;http://schema.org/> .

          &lt;https://pieterheyvaert.com/#me>
            knows:hasAvailabilityCalendar &lt;https://pieterheyvaert.com/#availability-calendar> .
          &lt;https://pieterheyvaert.com/#availability-calendar>
            schema:url "https://pheyvaer.pod.knows.idlab.ugent.be/availability" .`}
          </pre>
        </div>

        <div id="availability-calendar-example">
          <h3>How your availability calendar should look</h3>
          <p>
            Your availability calendar needs events annotated by{" "}
            <a href="http://schema.org/Event">schema:Event</a>. Each event needs
            at least a start and end date, annotated by{" "}
            <a href="http://schema.org/startDate">schema:startDate</a> and{" "}
            <a href="http://schema.org/endDate">schema:endDate</a>. For example,
            this is what you find in Pieter Heyvaert's availability calendar.
          </p>

          <pre>
            {`
    @prefix event: &lt;https://pieterheyvaert.com/dummy/event/> .
    @prefix schema: &lt;http://schema.org/> .

    &lt;https://pieterheyvaert.com/dummy/calendar/Availability%20of%20Pieter%20Heyvaert>
        schema:event event:0bcdd7ee585119f93b4ee5574c9c4275,
                     event:0f0cfa3c54d8cbdaf81e796ca2669fa1>;
        schema:name "Availability of Pieter Heyvaert" .

    event:0bcdd7ee585119f93b4ee5574c9c4275 a schema:Event;
        schema:endDate "2022-03-21T15:00:00.000Z";
        schema:name "Available for meetings";
        schema:startDate "2022-03-21T14:30:00.000Z" .

    event:0f0cfa3c54d8cbdaf81e796ca2669fa1 a schema:Event;
        schema:endDate "2022-03-23T13:30:00.000Z";
        schema:name "Available for meetings";
        schema:startDate "2022-03-23T13:00:00.000Z" .`}
          </pre>
        </div>
      </div>

      <div>
        <h2>Setting up vacation calendar</h2>
        <div id="vacation-calendar-webid">
          <h3>Configuring your WebID</h3>
          <p>
            Your WebID needs to point to your vacation calendar using the{" "}
            <code>
              https://data.knows.idlab.ugent.be/person/office/#hasVacationCalendar
            </code>
            . For example, this is what you find in Pieter Heyvaert's WebID.
          </p>

          <pre>
            {`
    @prefix knows: &lt;https://data.knows.idlab.ugent.be/person/office/#> .

    &lt;https://pieterheyvaert.com/#me>
      knows:hasAvailabilityCalendar &lt;https://pheyvaer.pod.knows.idlab.ugent.be/vacation-calendar#> .`}
          </pre>
        </div>

        <div id="vacation-calendar-example">
          <h3>How your availability calendar should look</h3>
          <p>
            Your vacation calendar needs days annotated by{" "}
            <code>knows:VacationDay</code>. Each day needs at least a date and
            part of day, annotated by <code>knows:date</code> and{" "}
            <code>knows:partOfDay</code>. For example, this is what you find in
            Pieter Heyvaert's vacation calendar.
          </p>

          <pre>
            {`
    @prefix knows: &lt;https://data.knows.idlab.ugent.be/person/office/#> .

    &lt;https://pheyvaer.pod.knows.idlab.ugent.be/vacation-calendar#>
        a knows:VacationCalender;
        knows:days [
          knows:date "2021-04-28";
          knows:partOfDay knows:FullDay
        ], [
          knows:date "2022-05-02";
          knows:partOfDay knows:Morning
        ],  [
          knows:date "2022-06-02";
          knows:partOfDay knows:Afternoon
        ].`}
          </pre>
        </div>
      </div>

      <div>
        <h2>Issues with CORS headers</h2>
        <p>
          CORS headers are completely under the control of the server where a
          WebID and POD are hosted. If there are issues with CORS headers,
          KNoodle can do nothing about them.
        </p>
      </div>

      <div>
        <h2>Source code</h2>

        <p>
          You find the source code in this{" "}
          <a href="https://github.com/KNowledgeOnWebScale/knoodle/">
            GitHub repository
          </a>
          .
        </p>
      </div>
    </>
  );
}
