import React, { useMemo } from "react";
import moment from "moment";
import {
  Calendar,
  Views,
  DateLocalizer,
  momentLocalizer,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const mLocalizer = momentLocalizer(moment);

const ColoredDateCellWrapper = ({ children }) =>
  React.cloneElement(React.Children.only(children), {
    style: {
      backgroundColor: "white",
    },
  });

export default function CustomCalendar({ localizer = mLocalizer, ...props }) {
  let { availableEvents, vacationEvents, clickEvent } = props;

  const { components, defaultDate, max, views } = useMemo(
    () => ({
      components: {
        timeSlotWrapper: ColoredDateCellWrapper,
      },
      defaultDate: new Date(),
      max: localizer.endOf(new Date(), "day"),
      views: Object.keys(Views).map((k) => Views[k]),
    }),
    []
  );

  return (
    <Calendar
      components={components}
      defaultDate={defaultDate}
      events={availableEvents.concat(vacationEvents)}
      localizer={localizer}
      min={localizer.startOf(new Date(), "day")}
      max={max}
      showMultiDayTimes
      step={60}
      views={views}
      defaultView={"week"}
      onSelectEvent={clickEvent}
      eventPropGetter={(event, start, end, isSelected) => {
        if (event["type"] == "vacation") {
          return {
            event,
            start,
            end,
            isSelected,
            style: { backgroundColor: "green" },
          };
        } else {
          return {
            event,
            start,
            end,
            isSelected,
          };
        }
      }}
    />
  );
}
