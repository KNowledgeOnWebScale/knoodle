# 🍜 KNoodle

KNoodle is KNoWS' (and OxfordHCC's) Solid-based alternative to Doodle. It allows you to find time slots that work for different people,
by using their availability calendar which is made available through a Solid pod.

The configuration and automatic syncing of calendar is handled by the [orchestrator](https://github.com/oxfordhcc/calendar-orchestrator). You may want to read its documentation if new here.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Local development

You may need to initialise the application first, and then start the development server.

### Clone project and submodules

```
git clone --recurse-submodules https://github.com/OxfordHCC/knoodle.git
```

This command will clone the project and download the submodules automatically.
If you have already cloned the project **but do not** have the submodules, run `git submodule update --init --recursive`.

### Install dependencies

```
npm i
```

### Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Suggested changes for your use case

1. Update the variable `employeesUrl` in `src/utils/participantsHelper.js` to point to your list of people that will use KNoodle.
2. Update the method `fetchParticipantWebIDs` in `src/utils/participantsHelper.js` to extract the people from the data that is found at `employeesUrl`.
3. Update the variable `participants` in `src/components/Schedule.js` to remove the dummy people.

## Development

- All of the react components are found under `src/components/` and `src/pages/`
- `src/utils/` contains code for data fetching and manipulation
- `src/data/` contains dummy data for the calendar component which can be ignored

## License

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and released under the [MIT license](http://opensource.org/licenses/MIT).
