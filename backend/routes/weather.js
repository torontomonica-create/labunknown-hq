import express from 'express';
import axios from 'axios';

const router = express.Router();

const CITY = 'Melville,SK,CA';
const UNITS = 'metric';

router.get('/', async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    return res.json({
      city: 'Melville, SK',
      temp: null,
      description: 'API 키 없음',
      icon: '❓',
      error: 'OPENWEATHER_API_KEY가 설정되지 않았습니다.',
    });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=${UNITS}&appid=${apiKey}&lang=kr`;
    const { data } = await axios.get(url);

    res.json({
      city: 'Melville, SK',
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6), // m/s → km/h
    });
  } catch (err) {
    res.status(500).json({ error: '날씨 정보를 가져오지 못했습니다.' });
  }
});

export default router;
