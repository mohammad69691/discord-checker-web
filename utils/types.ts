export type BillingCountryResponse = {
  country_code: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: number;
  avatar: string;
  flags: number;
  email: string;
  phone: string;
  verified: boolean;
};

export type DiscordAccount = {
  user: DiscordUser;
  tokens: string[];
};

export type InvalidDiscordAccount = {
  user: DiscordUser | { id?: string };
  token: string;
};
