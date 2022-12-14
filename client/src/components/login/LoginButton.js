import React, { useContext } from "react";
import { useQuery, gql, useApolloClient } from "@apollo/client";
import { withStyles, makeStyles } from "@material-ui/core/styles";
// This import loads the firebase namespace along with all its type information.
import firebase from "firebase/app";
import { Button } from "@material-ui/core";
// These imports load individual services into the firebase namespace.
import "firebase/auth";
import { useHistory } from "react-router";
import { Context as EmailContext } from "../../contexts/userEmailContext"
import FormControl from '@mui/material/FormControl';

const useStyles = makeStyles({
    button: {
        color: "var(--primary-color)",
    },
    marginRight: 10,
});
let user_email = localStorage.getItem("user_email");
let logoutURL = "https://idp.rice.edu/idp/profile/cas/logout";
function LoginButton(props) {
    // Get history object for redirection to auth page
    const classes = useStyles();
    const history = useHistory();
    const {
        state: { email },
        getEmail,
    } = useContext(EmailContext)
    const signInSAML = async () => {
        await firebase
            .auth()
            .setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const provider = new firebase.auth.SAMLAuthProvider(
            "saml.rice-shibboleth"
        );
        const loginResult = await firebase.auth().signInWithPopup(provider);
        const net_id =
            loginResult.additionalUserInfo.profile[
            "urn:oid:0.9.2342.19200300.100.1.1"
            ];
        const given_email =
            loginResult.additionalUserInfo.profile[
            "urn:oid:0.9.2342.19200300.100.1.3"
            ];
        localStorage.setItem("user_email", net_id.toString() + "@rice.edu");
        getEmail(net_id.toString() + "@rice.edu")
        localStorage.setItem("given_email", given_email.toString());
        const userToken = await firebase.auth().currentUser.getIdToken(true);
        history.push("/auth", {
            profile: loginResult.additionalUserInfo.profile,
            token: userToken,
        });
        login_logout_button();
    };
    const handleLogoutClick = async () => {
        // Sign out of firebase first
        await firebase
            .auth()
            .signOut()
            .then(() => {
                localStorage.setItem("user_email", "");
                localStorage.setItem("given_email", "");
                getEmail('')
                login_logout_button();
                // Sign out of IDP too
                window.open(logoutURL, "_blank");
            });
    };
    const login_logout_button = () => {
        user_email = localStorage.getItem("user_email");
        // console.log("user email:", user_email);
        let ll_button = (
            <Button
                style={{
                    color: "var(--primary-color)",
                    border: "1px solid var(--primary-color)",
                }}
                className={classes.button}
                variant="outlined"
                onClick={signInSAML}
            >
                {" "}
                Login
            </Button>
        );
        if (user_email !== "" && user_email !== null) {
            ll_button = (
                <Button
                    style={{
                        color: "var(--primary-color)",
                        border: "1px solid var(--primary-color)",
                    }}
                    className={classes.button}
                    variant="outlined"
                    onClick={handleLogoutClick}
                >
                    Logout
                </Button>
            );
        }
        return ll_button;
    };
    if (props.full_width) {
        return (
            <FormControl fullWidth>
                {login_logout_button()}
            </FormControl>
        );
    } else {
        return (
            <FormControl>
                {login_logout_button()}
            </FormControl>
        );
    }
}
// This is the function that redirects the user to the SAML login
export default LoginButton;
