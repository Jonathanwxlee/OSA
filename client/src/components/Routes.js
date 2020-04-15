import React, { Component } from 'react'
import { Switch, Route, Redirect } from 'react-router'
import Auth from './auth/Auth';
import Login from './login/Login';
import Main from './main/Main';
import { verifyRequest, getService } from '../actions/AuthActions'
import { connect } from 'react-redux'

const PrivateRoute = ({ children, loggedIn, verifyRequest, ...rest }) => {
    console.log(loggedIn);
    console.log(localStorage.getItem('token'));
    return (
        <Route {...rest} render={(props) => {
            if (loggedIn) {
                return (children);
            } else {
                // Check if token
                if (localStorage.getItem('token')) {
                    verifyRequest();
                } else {
                    // Redirect to login
                    props.history.push("/login");
                }
            }
        }} />
    )
}

const Routes = ({ loggedIn, verifyRequest, getService }) => {
    // Get service to start
    getService();

    return (
        <Switch>
            <Route path="/auth">
                <Auth />
            </Route>
            <Route path="/login">
                <Login />
            </Route>
            <PrivateRoute 
            path="/schedule" 
            loggedIn={loggedIn} 
            verifyRequest={verifyRequest}>
                <Main />
            </PrivateRoute>
            <PrivateRoute 
            path="/"
            loggedIn={loggedIn}
            verifyRequest={verifyRequest}>
                <Redirect to="/schedule" />
            </PrivateRoute>
        </Switch>
    )
}

export default connect(
    (state) => ({
        loggedIn: state.auth.loggedIn
    }),
    (dispatch) => ({
        verifyRequest: () => dispatch(verifyRequest()),
        getService: () => dispatch(getService())
    })
)(Routes);