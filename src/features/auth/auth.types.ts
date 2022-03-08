export type AuthInfos = {
  application: {
    id: string;
    name: string;
    icon: string;
    description: string;
    summary: string;
    hook: boolean;
    bot_public: boolean;
    bot_require_code_grant: boolean;
    verify_key: string;
  };
  scopes: string[];
  expires: string;
  user: {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
  };
};
