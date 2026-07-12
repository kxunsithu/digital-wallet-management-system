import { RouterProvider } from "react-router-dom";
import router from "./routes/router";
import ToasterProvider from "./components/ui/ToasterProvider";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToasterProvider />
    </>
  );
}

export default App;
