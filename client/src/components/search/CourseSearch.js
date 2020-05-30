import React, { useState, useEffect } from "react";
import Selection from "./Selection";
import CourseList from "./CourseList";
import config from '../../config';
import { initGA } from "../../utils/analytics";
import { useQuery, gql } from "@apollo/client";

const dummy = { label: "", value: "" };

const styles = {
    filter: {
        width:"100%",
    },
    button: {
        display:"inline-block", 
        float:"center",
        margin: 8, 
        padding: 2,
    },
}

/**
 * TODO: MAKE A FRAGMENT! THIS IS USED IN TWO PLACES
 * Gets the term from local state management
 */
const GET_TERM = gql`
    query {
        term @client
    }
`;

/**
 * Fetches all departments for a particular term
 * @param term: Term to use for subjects (term format: 202030, 202110, etc)
 */
const fetchDepts = async (term) => {
    let response = await fetch("/api/courses/getAllSubjects?term=" + term);
    let result = await response.json();
    return result;
}

const CourseSearch = ({ scheduleID }) => {
    const [getDepts, setDepts] = useState([]); // Used for the entire list of departments
    const [getDept, setDept] = useState(dummy); // Used for selection of a particular department
    const { data: { term } } = useQuery(GET_TERM); // Gets the term which we need to request subjects from

    useEffect(
        () => {
            fetchDepts(term)
            .then(subjects => {
                // Transform each subject into an object that can be used with the selector
                setDepts(subjects.map(dept => ({label: dept, value: dept})));
            })
        }, []
    );

    const handleChangeDept = selectedOption => {
        setDept(selectedOption);
    };

    // Initialize Google Analytics
    initGA();

    return (
    <div className="Search">
        <div style={styles.filter}>
            <p style={styles.button}>Department</p>
            <Selection
                title="Department"
                options={getDepts} 
                selected={getDept}
                show={true}
                handleChange={handleChangeDept}
            />
        </div>
        <CourseList scheduleID={scheduleID} department={getDept.value} />
    </div>
    );
}

export default CourseSearch;