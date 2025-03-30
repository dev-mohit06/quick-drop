import { createBrowserRouter } from 'react-router-dom';

import Home from '../home';
import Create from '../pages/create';
import Join from '../pages/join';
import Transfer from '../pages/transfer';

const routes = createBrowserRouter([
    {
        path : '/',
        children : [
            {
                index : true,
                element : <Home />
            },
            {
                path : '/create',
                element : <Create />
            },
            {
                path : '/join',
                element : <Join />
            },
            {
                path : '/transfer',
                element : <Transfer />
            }
        ]
    }
]);

export default routes;