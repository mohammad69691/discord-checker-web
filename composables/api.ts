import axios from 'axios';

async function apiRequest(
  uri: string,
  { data = null, token = null, returnBoolean = false, delay = 0, method = 'GET' } = {}
) {
  try {
    if (delay && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const url = useRuntimeConfig().public.GATEWAY_URL + uri;
    const response = await axios.request({ url, data, method, headers: token ? { Authorization: token } : {} });

    return returnBoolean ? true : response.data;
  } catch (err) {
    if (err.response && err.response.status === 429) {
      const waitTime = err.response.data.retry_after * 1000;
      return apiRequest(uri, { data, token, returnBoolean, delay: waitTime });
    }

    return returnBoolean ? false : null;
  }
}

function fetchUser(userId = '@me', config = {}) {
  return apiRequest(`/users/${userId}`, config);
}

function fetchBillingCountry(config = {}) {
  return apiRequest(`/users/@me/billing/country-code`, config);
}

export { fetchUser, fetchBillingCountry };
