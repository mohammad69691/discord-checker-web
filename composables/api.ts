import type { BillingCountryResponse, DiscordUser } from '~/utils/types';

type RequestConfig = {
  data?: object;
  token?: string;
  delay?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
};

async function apiRequest(uri: string, config: RequestConfig): Promise<any> {
  const { data = null, token = null, delay = 0, method = 'GET' } = config;
  try {
    if (delay && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const url = useRuntimeConfig().public.GATEWAY_URL + uri;
    return await $fetch(url, { method, body: data, headers: token ? { Authorization: token } : {} });
  } catch (err) {
    if (err.response && err.response.status === 429) {
      return apiRequest(uri, { data, token, delay: err.response._data.retry_after * 1000 });
    }

    return null;
  }
}

function fetchUser(userId: string = '@me', config: RequestConfig = {}): Promise<DiscordUser | null> {
  return apiRequest(`/users/${userId}`, config);
}

function fetchBillingCountry(config: RequestConfig = {}): Promise<BillingCountryResponse | null> {
  return apiRequest('/users/@me/billing/country-code', config);
}

export { fetchUser, fetchBillingCountry };
