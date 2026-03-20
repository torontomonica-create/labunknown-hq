export default async (req) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'OPENWEATHER_API_KEY not configured' }, { status: 500 });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Melville,SK,CA&units=metric&appid=${apiKey}&lang=kr`;
    const res = await fetch(url);
    const data = await res.json();

    return Response.json({
      city: 'Melville, SK',
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6),
    });
  } catch {
    return Response.json({ error: '날씨 정보를 가져오지 못했습니다.' }, { status: 500 });
  }
};

export const config = { path: '/api/weather' };
