import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import DefaultLayout from './layout/DefaultLayout';
import Course from './pages/Course';
import Material from './pages/Material';
import Assessment from './pages/Assessment';
import Assignment from './pages/Assignment';
import User from './pages/User';
import CourseDetail from './pages/CourseDetail';
import UserCourse from './pages/UserCourse';
import Testing from './pages/Testing';
import EditQuestion from './pages/EditQuestion';
import Badge from './pages/Badge';
import Login from './pages/Login';
import Trade from './pages/Trade';
import AssessmentResponse from './pages/AssessmentResponse';
import DetailResponse from './pages/DetailResponse';
import AssignmentResponse from './pages/AssignmentResponse';
import SignIn from './pages/Authentication/SignIn';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/course" /> : <Login />}
      />

      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <DefaultLayout>
              <Routes>
                <Route index element={<Navigate to="/course" replace />} />
                <Route
                  path="/course"
                  element={
                    <>
                      <PageTitle title="Course" />
                      <Course />
                    </>
                  }
                />
                <Route
                  path="/course/:id"
                  element={
                    <>
                      <PageTitle title="Course Detail" />
                      <CourseDetail />
                    </>
                  }
                />
                <Route
                  path="/Badge"
                  element={
                    <>
                      <PageTitle title="Badge" />
                      <Badge />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/material/:id"
                  element={
                    <>
                      <PageTitle title="Material" />
                      <Material />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assessment/:id"
                  element={
                    <>
                      <PageTitle title="Assessment" />
                      <Assessment />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assignment/:id"
                  element={
                    <>
                      <PageTitle title="Assignment" />
                      <Assignment />
                    </>
                  }
                />
                <Route
                  path="/user"
                  element={
                    <>
                      <PageTitle title="User" />
                      <User />
                    </>
                  }
                />
                <Route
                  path="/usercourse/:id"
                  element={
                    <>
                      <PageTitle title="User Course" />
                      <UserCourse />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assessment/:id/edit-question/:index"
                  element={
                    <>
                      <PageTitle title="Edit Question" />
                      <EditQuestion />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assessment/:assessId/response"
                  element={
                    <>
                      <PageTitle title="Assessment Response" />
                      <AssessmentResponse />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assessment/:assessId/response/:userId"
                  element={
                    <>
                      <PageTitle title="Assessment Detail" />
                      <DetailResponse />
                    </>
                  }
                />
                <Route
                  path="/course/:courseId/assignment/:assignId/response"
                  element={
                    <>
                      <PageTitle title="Assignment Response" />
                      <AssignmentResponse />
                    </>
                  }
                />
                <Route
                  path="/trade"
                  element={
                    <>
                      <PageTitle title="Trades" />
                      <Trade />
                    </>
                  }
                />
              </Routes>
            </DefaultLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/testing"
        element={
          <>
            <PageTitle title="testing" />
            <SignIn />
          </>
        }
      />
    </Routes>
  );
}

export default App;
