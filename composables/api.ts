import axios from 'axios';

const GATEWAY_URL = 'https://discord.com/api/v9';

async function apiRequest(
  uri,
  { data = null, token = null, returnBoolean = false, delay = 0, deleteRequest = false } = {}
) {
  try {
    if (delay && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    let response;
    if (!data) {
      response = !deleteRequest
        ? await axios.get(GATEWAY_URL + uri, token ? { headers: { Authorization: token } } : {})
        : await axios.delete(GATEWAY_URL + uri, token ? { headers: { Authorization: token } } : {});
    } else {
      response = await axios.post(GATEWAY_URL + uri, data, token ? { headers: { Authorization: token } } : {});
    }
    return returnBoolean ? true : response.data;
  } catch (err) {
    if (err.response) {
      if (err.response.status === 429) {
        const waitTime = err.response.data.retry_after * 1000;
        return apiRequest(uri, {
          data,
          token,
          returnBoolean,
          delay: waitTime,
        });
      }
    }

    return returnBoolean ? false : null;
  }
}

export { apiRequest };
