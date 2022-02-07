import React, { useState, useEffect, useContext } from "react";
import Title from "./Title";
import LoginButton from "../login/LoginButton";
import { Button, ButtonGroup, IconButton } from "@material-ui/core";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import { useMediaQuery } from "react-responsive";
import { initGA, OutboundLink } from "../../utils/analytics";
import { useHistory, useLocation } from "react-router";
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import ListIcon from "@material-ui/icons/List";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Context as BottomModeContext } from "../../contexts/bottomModeContext";
import Modal from "react-modal";
import { RiDeleteBinLine } from "react-icons/ri";
import { GoDiffAdded } from "react-icons/go";
import { AiOutlineEdit } from "react-icons/ai";

import "./Header.global.css";
// This import loads the firebase namespace along with all its type information.
import firebase from "firebase/app";
// These imports load individual services into the firebase namespace.
import "firebase/auth";
import SemesterSelect from "../draftview/SemesterSelect";
import DegreePlanSelect from "../draftview/DegreePlanSelect";
import { flexbox } from "@mui/system";

const useStyles = makeStyles({
    button: {
        color: "#1DC2C4",
        fontSize: 15,
    },
    button2: {
        color: "#1DC2C4",
        border: "1px solid #BBECED",
        width: 150,
    },
    button3: {
        color: "#1DC2C4",
        border: "1px solid #1DC2C4",
        width: 80,
    },
    button4: {
        height: 50,
        color: "red",
        border: "1px solid red",
    },
    button5: {
        height: 50,
        color: "#1DC2C4",
        border: "1px solid #1DC2C4",
    },
});

const QUERY_USER_DEGREE_PLAN_LIST = gql`
    query QUERY_ALL_USER_DEGREE_PLANS_LIST($_id: ID!) {
        findAllDegreePlansListForUsers(_id: $_id) {
            _id
            name
            user {
                firstName
            }
        }
    }
`;

const REMOVE_DEGREE_PLAN = gql`
    mutation removeDegreePlanParent($_id: MongoID) {
        removeDegreePlanParent(filter: { _id: $_id }) {
            name
            _id
        }
    }
`;

const ADD_DEGREE_PLAN = gql`
    mutation createNewDegreePlanList($name: String) {
        createNewDegreePlanList(record: { name: $name }) {
            name
            user {
                firstName
            }
            _id
        }
    }
`;

const UPDATE_DEGREE_PLAN_NAME = gql`
    mutation updateDegreePlanParentName($name: String, $_id: MongoID) {
        updateDegreePlanParentName(
            record: { name: $name }
            filter: { _id: $_id }
        ) {
            name
            _id
        }
    }
`;

const VERIFY_TOKEN = gql`
    query VerifyToken {
        verifyToken {
            _id
            firstName
            lastName
            netid
            majors
            college
            affiliation
            token
        }
    }
`;

const GET_LOCAL_DATA = gql`
    query GetLocalData {
        term @client
        recentUpdate @client
        degreeplanparent @client
        degreeplanname @client
        degreeplanlist @client
    }
`;

function LinkTab(props) {
    return (
        <StyledTab
            component="a"
            onClick={(event) => {
                event.preventDefault();
            }}
            value={props.value}
            {...props}
        />
    );
}

const StyledTab = withStyles((theme) => ({
    root: {
        textTransform: "none",
        color: "#1DC2C4",
        fontWeight: theme.typography.fontWeightRegular,
        fontSize: theme.typography.pxToRem(15),
        marginRight: theme.spacing(1),
        height: "100%",
        width: 100,
    },
}))((props) => <Tab {...props} />);

function Header() {
    const [value, setValue] = React.useState(0);
    const classes = useStyles();
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };
    const history = useHistory();
    const {
        state: { bottomMode2 },
        changeBottomMode,
    } = useContext(BottomModeContext);

    const handleClick = (e) => {
        if (bottomMode2) {
            changeBottomMode("");
        } else {
            changeBottomMode(e.currentTarget.value);
        }
    };
    const location = useLocation();
    const [userId, setUserId] = useState("");
    const {
        loading: loading4,
        error: error4,
        data: data4,
    } = useQuery(VERIFY_TOKEN);

    let { data: storeData } = useQuery(GET_LOCAL_DATA);
    let { degreeplanparent, degreeplanlist } = storeData;

    useEffect(() => {
        if (data4) {
            setUserId(data4.verifyToken._id);
        }
    }, [loading4, data4, error4]);
    const [addDegreePlan, { loadingMutation1, errorMutation1, dataMutation1 }] =
        useMutation(ADD_DEGREE_PLAN, {
            refetchQueries: () => [
                {
                    query: QUERY_USER_DEGREE_PLAN_LIST,
                    variables: {
                        _id: userId,
                    },
                },
            ],
        });
    const [
        mutateDegreePlan,
        { loadingMutation2, errorMutation2, dataMutation2 },
    ] = useMutation(UPDATE_DEGREE_PLAN_NAME, {
        refetchQueries: () => [
            {
                query: QUERY_USER_DEGREE_PLAN_LIST,
                variables: {
                    _id: userId,
                },
            },
        ],
    });

    const [
        deleteDegreePlan,
        { loadingMutation3, errorMutation3, dataMutation3 },
    ] = useMutation(REMOVE_DEGREE_PLAN, {
        refetchQueries: () => [
            {
                query: QUERY_USER_DEGREE_PLAN_LIST,
                variables: {
                    _id: userId,
                },
            },
        ],
    });

    //modal 1: add new degree plan
    const [modalState, setModal] = useState(false);
    const openModal = () => {
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
    };

    //modal 2: edit current degree plan
    const [modalState2, setModal2] = useState(false);
    const openModal2 = () => {
        setModal2(true);
    };

    const closeModal2 = () => {
        setModal2(false);
    };

    //modal 3: remove current degree plan
    const [modalState3, setModal3] = useState(false);
    const openModal3 = () => {
        setModal3(true);
    };

    const closeModal3 = () => {
        setModal3(false);
    };

    const [inputName, setInputName] = useState("");
    const client = useApolloClient();

    // Where we collect feedback
    const isDesktopOrLaptop = useMediaQuery({
        query: "(min-device-width: 608px)",
    });
    let feedbackURL = "https://forms.gle/gSJp5Dy9a2WH7Nk1A";
    // This initializes Google Analytics
    initGA();
    // Redirects people to our Medium page on a new page if they click our logo to learn more about us
    const handleLogoClick = () => {
        OutboundLink(
            "Clicked Logo.",
            window.open("https://medium.com/riceapps", "_blank")
        );
    };
    const renderIcons = () => {
        const icons = [
            <SearchOutlinedIcon />,
            <DateRangeOutlinedIcon />,
            <ListIcon />,
        ];
        const values = ["Search", "Calendar", "Details"];

        return icons.map((icon, index) => (
            <IconButton
                className={classes.button}
                size="small"
                onClick={handleClick}
                value={values[index]}
                style={{
                    backgroundColor:
                        bottomMode2 != values[index] ? "#BBECED" : "",
                }}
            >
                {icon}
            </IconButton>
        ));
    };
    const handleDeletePlan = () => {
        if (degreeplanlist.findAllDegreePlansListForUsers.length > 1) {
            deleteDegreePlan({
                variables: {
                    _id: degreeplanparent,
                },
            });
            setModal3(false);
        } else {
            alert("You must have at least 1 degree plan");
        }
    };
    return (
        <div className="headerContainer">
            <div className="titleContainer">
                <Title />
            </div>
            <div className="leftAlign">
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    TabIndicatorProps={{
                        style: { backgroundColor: "#1DC2C4" },
                    }}
                    tabItemContainerStyle={{ width: 50 }}
                    aria-label="nav tabs"
                >
                    <LinkTab
                        label="Schedule"
                        onClick={() => history.push("/schedule")}
                    />
                    <LinkTab
                        label="Degree Plan"
                        onClick={() => history.push("/degree_plan")}
                    />
                    <LinkTab
                        label="About"
                        onClick={() => history.push("/about")}
                    />
                    {/* <LinkTab
                        label="Feedback"
                        onClick={() => window.open(feedbackURL, "_blank")}
                    /> */}
                </Tabs>
            </div>
            {location.pathname == "/schedule" ? (
                <>
                    <SemesterSelect></SemesterSelect>
                    <div className="buttonSelect">{renderIcons()}</div>
                </>
            ) : (
                <div
                    style={{
                        width: "30%",
                        height: "100%",
                        marginRight: 50,
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-around",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "65%",
                            height: "100%",
                            zIndex:
                                modalState || modalState2 || modalState3
                                    ? -99
                                    : 10,
                        }}
                    >
                        <DegreePlanSelect></DegreePlanSelect>
                    </div>
                    <div className="icon-box">
                        <div className="icon-container">
                            <RiDeleteBinLine
                                onClick={() => setModal3(true)}
                                size={20}
                            />
                        </div>

                        <div className="icon-container">
                            <AiOutlineEdit
                                onClick={() => setModal2(true)}
                                size={20}
                            />
                        </div>

                        <div className="icon-container">
                            <GoDiffAdded
                                onClick={() => setModal(true)}
                                size={20}
                            />
                        </div>
                        <Modal
                            isOpen={modalState}
                            className="modalDegreePlanHeader"
                            onRequestClose={closeModal}
                            ariaHideApp={false}
                        >
                            <div className="contentContainer">
                                <div className="nameContainer">
                                    Create a new Degree Plan
                                </div>
                                <div className="inputContainer">
                                    <input
                                        type="text"
                                        className="header-search"
                                        placeholder="Name of your plan"
                                        name="s"
                                        value={inputName}
                                        onChange={(e) =>
                                            setInputName(e.target.value)
                                        }
                                    />
                                    <div className="buttonContainer">
                                        <Button
                                            style={{
                                                color: "#1DC2C4",
                                                border: "1px solid 1DC2C4",
                                            }}
                                            className={classes.button3}
                                            variant="outlined"
                                            onClick={() => {
                                                addDegreePlan({
                                                    variables: {
                                                        name: inputName,
                                                    },
                                                });
                                                setModal(false);
                                            }}
                                        >
                                            {" "}
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Modal>

                        <Modal
                            isOpen={modalState2}
                            className="modalDegreePlanHeader"
                            onRequestClose={closeModal2}
                            ariaHideApp={false}
                        >
                            <div className="contentContainer">
                                <div className="nameContainer">
                                    Change your plan's name
                                </div>
                                <div className="inputContainer">
                                    <input
                                        type="text"
                                        className="header-search"
                                        placeholder="New name of your plan"
                                        name="s"
                                        value={inputName}
                                        onChange={(e) =>
                                            setInputName(e.target.value)
                                        }
                                    />
                                    <div className="buttonContainer">
                                        <Button
                                            style={{
                                                color: "#1DC2C4",
                                                border: "1px solid 1DC2C4",
                                            }}
                                            className={classes.button3}
                                            variant="outlined"
                                            onClick={() => {
                                                mutateDegreePlan({
                                                    variables: {
                                                        _id: degreeplanparent,
                                                        name: inputName,
                                                    },
                                                });
                                                client.writeQuery({
                                                    query: GET_LOCAL_DATA,
                                                    data: {
                                                        degreeplanname:
                                                            inputName,
                                                    },
                                                });
                                                setModal2(false);
                                            }}
                                        >
                                            {" "}
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Modal>

                        <Modal
                            isOpen={modalState3}
                            className="modalDegreePlanHeader"
                            onRequestClose={closeModal3}
                            ariaHideApp={false}
                        >
                            <div className="contentContainer">
                                <div className="nameContainerDelete">
                                    Are you sure you want to remove the current
                                    degree plan ?
                                </div>
                                <div
                                    style={{
                                        width: "90%",
                                        height: "50%",
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-around",
                                    }}
                                >
                                    <Button
                                        className={classes.button4}
                                        variant="outlined"
                                        onClick={handleDeletePlan}
                                    >
                                        {" "}
                                        Remove
                                    </Button>
                                    <Button
                                        style={{
                                            color: "#1DC2C4",
                                            border: "1px solid 1DC2C4",
                                        }}
                                        className={classes.button5}
                                        variant="outlined"
                                        onClick={() => setModal3(false)}
                                    >
                                        {" "}
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Modal>
                    </div>
                </div>
            )}

            <LoginButton></LoginButton>
        </div>
    );
}
export default Header;
