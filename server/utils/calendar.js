function generateGoogleCalendarLink({ title, description, location, startDate, endDate }) {

  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d+/g, "");
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate || new Date(new Date(startDate).getTime() + 30 * 60000));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location: location || "PetHealth",
    dates: `${start}/${end}`
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

module.exports = generateGoogleCalendarLink;
