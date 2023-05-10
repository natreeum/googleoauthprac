const { default: axios } = require('axios');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
const PORT = 8080;

// express에서 정적 파일 사용하기
// https://expressjs.com/ko/starter/static-files.html
app.use(express.static('public'));

// cors 설정
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const AUTHORIZE_URI = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_URL = 'http://localhost:8080/oauth2/redirect';
const RESPONSE_TYPE = 'code';
const SCOPE = 'openid%20profile%20email';
const ACCESS_TYPE = 'offline';
const OAUTH_URL = `${AUTHORIZE_URI}?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URL}&scope=${SCOPE}&access_type=${ACCESS_TYPE}`;

const getToken = async (code) => {
  try {
    const tokenApi = await axios.post(
      `https://oauth2.googleapis.com/token?code=${code}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${REDIRECT_URL}&grant_type=authorization_code`
    );
    const accessToken = tokenApi.data.access_token;

    return accessToken;
  } catch (err) {
    return err;
  }
};

const getUserInfo = async (accessToken) => {
  try {
    const userInfoApi = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?alt=json`,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return userInfoApi;
  } catch (err) {
    return err;
  }
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/auth/google', (req, res) => {
  res.send(OAUTH_URL);
});

app.get('/oauth2/redirect', async (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/oauth2/accesstoken', async (req, res) => {
  const code = req.query.code;
  const accessToken = await getToken(code);
  const userInfo = (await getUserInfo(accessToken)).data;
  const webtoken = jwt.sign(
    { email: userInfo.email, provider: 'google' },
    process.env.JWT_SECRET
  );
  return res.send(webtoken);
});

app.get('/user/data', async (req, res) => {
  const jwt = req.headers.authorization;
});

app.listen(PORT, () => {
  console.log('server on! http://localhost:' + PORT);
});
