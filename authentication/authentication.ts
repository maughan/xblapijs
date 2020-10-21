let clientId = null;
let clientSecret = null;
let redirectUrl = null;

let oauth = null;
let userToken = null;
let xstsToken = null;
const defaultScopes = ["Xboxlive.signin", "Xboxlive.offline_access"];

function isValid(token: Date) {
    return token < new Date();
}

    export function generateAuthorizationUrl() {
        return `https://login.live.com/oauth20_authorize.srf?client_id=${clientId}&response_type=code&approval_prompt=auto&scope=${defaultScopes.join()}&redirect_url=${redirectUrl}`
    }

    export async function requestTokens(authCode: string) {
        oauth = await this.requestOauthToken(authCode);
        userToken = await this.requestUserToken();
        xstsToken = await this.requestXstsToken();
    }

    export async function refreshTokens() {
        if (!oauth && !isValid(oauth)) oauth = await this.refreshOauthToken();
        if (!userToken && !isValid(userToken)) oauth = await this.requestUserToken();
        if (!xstsToken && !isValid(xstsToken)) oauth = await this.requestXstsToken();
    }

    async function requestOauthToken(authCode: string) {
        return await Oauth2TokenRequest({
            "grant_type": "authorization_code",
            "code": authCode,
            "redirect_url": redirectUrl,
        })
    }

    async function refreshOauthToken() {
        return await Oauth2TokenRequest({
            "grant_type": "refresh_token",
            "refresh_token": oauth.refresh_token,
        })
    }

    async function Oauth2TokenRequest(data: Record<string, string>) {
        data["client_id"] = clientId;
        data['scope'] = defaultScopes.join();
        if (clientSecret) data["client_secret"] = clientSecret;
        return await fetch("https://login.live.com/oauth20_token.srf", data).then(res => res.json()).catch(e => console.error(e));
    }

     async function requestUserToken() {
        return await fetch("https://user.auth.xboxlive.com/user/authenticate", {
            headers: {
                "x-xbl-contract-version": "1"
            },
            body: JSON.stringify({
                "RelyingParty": "http://auth.xboxlive.com",
                "TokenType": "JWT",
                "Properties": {
                    "AuthMethod": "RPS",
                    "SiteName": "user.auth.xboxlive.com",
                    "RpsTicket": oauth.access_token,
                }
            })
        }).then(res => res.json()).catch(e => console.error(e));
    }

    async function requestXstsToken() {
        return await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
            headers: {
                "x-xbl-contract-version": "1"
            },
            body: JSON.stringify({
                "RelyingParty": "http://xboxlive.com",
                "TokenType": "JWT",
                "Properties": {
                    "SandboxId": "RETAIL",
                    "UserTokens": userToken.token,
                }
            })
        })
    }
