export type BillingCountryResponse = {
  country_code: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: number;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  flags?: number;
  public_flags?: number;
  purchased_flags?: number;
  banner?: string;
  banner_color?: string;
  accent_color?: number;
  bio?: string;
  nsfw_allowed?: boolean;
  email?: string;
  phone?: string;
  verified?: boolean;
  premium_type?: number;
};

export type DiscordAccount = {
  user: DiscordUser;
  tokens: string[];
};

export type InvalidDiscordAccount = {
  user: DiscordUser | { id?: string };
  token: string;
};
