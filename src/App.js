import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container, Row, Alert } from 'react-bootstrap';
import { ExamScores, ExamForm } from './ExamComponents.js';
import AppTitle from './AppTitle.js';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import API from './API';
import { LoginForm, LogoutButton } from './LoginComponents';

function App() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(true);
  const [message, setMessage] = useState('');
  const [loggedIn, setLoggedIn] = useState(false); // at the beginning, no user is logged in

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        // here you have the user info, if already logged in
        // TODO: store them somewhere and use them, if needed
        await API.getUserInfo();
        setLoggedIn(true);
      } catch(err) {
        console.error(err.error);
      }
    };
    checkAuth();
  }, []);

  useEffect(()=> {
    const getCourses = async () => {
      if(loggedIn) {
        const courses = await API.getAllCourses();
        setCourses(courses);
        setDirty(true);
      }
    };
    getCourses()
      .catch(err => {
        setMessage({msg: "Impossible to load your exams! Please, try again later...", type: 'danger'});
        console.error(err);
      });
  }, [loggedIn]);

  useEffect(()=> {
    const getExams = async () => {
      const exams = await API.getAllExams();
      setExams(exams);
    };
    if(courses.length && dirty) {
      getExams().then(() => {
        setLoading(false);
        setDirty(false);
      }).catch(err => {
        setMessage({msg: 'Impossible to load your exams! Please, try again later...', type: 'danger'});
        console.error(err);
      });
    }
  }, [courses.length, dirty]);

  /* TO UPDATE: With requests in parallel...
  useEffect(() => {
    const promises = [API.getAllCourses(), API.getAllExams()];
    Promise.all(promises).then(
      ([cs, ex]) => {
        setCourses(cs);
        setExams(ex);
        setLoading(false);
      }
    ).catch(err => {
        setErrorMsg("Impossible to load your exams! Please, try again later...");
        console.error(err);
      });
  }, []);

  useEffect(()=> {
    const getExams = async () => {
      const exams = await API.getAllExams();
      setExams(exams);
    };
    if(courses.length && dirty) {
      getExams().then(() => {
        setDirty(false);
      }).catch(err => {
        setErrorMsg("Impossible to load your exams! Please, try again later...");
        console.error(err);
      });
    }
  }, [dirty]); */

  const handleErrors = (err) => {
    if(err.errors)
      setMessage({msg: err.errors[0].msg + ': ' + err.errors[0].param, type: 'danger'});
    else
      setMessage({msg: err.error, type: 'danger'});
    
    setDirty(true);
  }

  const deleteExam = (coursecode) => {
    // temporary set the deleted item as "in progress"
    setExams(oldExams => {
      return oldExams.map(ex => {
        if (ex.coursecode === coursecode)
          return {...ex, status: 'deleted'};
        else
          return ex;
      });
    });

    API.deleteExam(coursecode)
      .then(() => {
        setDirty(true);
      }).catch(err => handleErrors(err) );
  }

  const addExam = (exam) => {
    exam.status = 'added';
    setExams(oldExams => [...oldExams, exam]);

    API.addExam(exam)
      .then(() => {
        setDirty(true);
      }).catch(err => handleErrors(err) );
  }

  const updateExam = (exam) => {
    setExams(oldExams => {
      return oldExams.map(ex => {
        if (ex.coursecode === exam.coursecode)
          return {coursecode: exam.coursecode, score: exam.score, date: exam.date, status: 'updated'};
        else
          return ex;
      });
    });

    API.updateExam(exam)
      .then(() => {
        setDirty(true);
      }).catch(err => handleErrors(err) );;
  }

  const doLogIn = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setMessage({msg: `Welcome, ${user}!`, type: 'success'});
    } catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  }

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setCourses([]);
    setExams([]);
  }

  const examCodes = exams.map(exam => exam.coursecode);

  return (<Router>
    <Container className="App">
      <Row>
        <AppTitle/>
        {loggedIn ? <LogoutButton logout={doLogOut} /> : <Redirect to="/login" />}
      </Row>
      {message && <Row>
         <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
      </Row> }

      <Switch>
        <Route path="/login" render={() => 
          <>{loggedIn ? <Redirect to="/" /> : <LoginForm login={doLogIn} />}</>
        }/>

        <Route path="/add" render={() => 
          <ExamForm courses={courses.filter(course => !examCodes.includes(course.coursecode))} addOrUpdateExam={addExam}></ExamForm>
        }/>

        {/* without useLocation():
        <Route path="/update" render={(routeProps) => 
          <ExamForm courses={courses} exam={routeProps.location.state.exam} examDate={routeProps.location.state.examDate} addOrUpdateExam={updateExam}></ExamForm>
        }/>
        */}
        {/* with useLocation() in ExamForm */}
        <Route path="/update" render={() => 
          <ExamForm courses={courses} addOrUpdateExam={updateExam}></ExamForm>
        }/>

        <Route path="/" render={() =>
        <>
          {loggedIn ?
            <Row>
              {loading ? <span>🕗 Please wait, loading your exams... 🕗</span> :
              <ExamScores exams={exams} courses={courses} deleteExam={deleteExam}/> }
            </Row>
          : <Redirect to="/login" /> }
        </>
        } />
        
      </Switch>
    </Container>
  </Router>);
}

export default App;
