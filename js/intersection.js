export function intersect(...availabilityLists) {
  if (availabilityLists.length < 2) {
    throw new Error('At least provide 2 availability lists.');
  }

  let overlaps = availabilityLists[0];
  console.log(overlaps);
  availabilityLists.splice(0, 1);

  availabilityLists.forEach(list => {
    const temp = [];
    console.log(list);

    list.forEach(slotList => {
      overlaps.forEach(slotOverlap => {
        const newOverlap = getOverlap(slotOverlap, slotList);

        if (newOverlap) {
          temp.push(newOverlap);
          console.log(`New overlap ${newOverlap.startDate} for slot list ${slotList.startDate} and slot overlap ${slotOverlap.startDate}`);
        }
      });
    });

    overlaps = temp;
  });

  return overlaps;
}

function getOverlap(first, second) {
  if (first.startDate > second.startDate) {
    const temp = first;
    first = second;
    second = temp;
  }

  if (second.startDate < first.endDate) {
    const overlap = {};
    overlap.startDate = second.startDate;

    if (second.endDate < first.endDate) {
      overlap.endDate = second.endDate;
    } else {
      overlap.endDate = first.endDate;
    }

    return overlap;
  } else {
    return null;
  }
}
