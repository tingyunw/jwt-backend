import fastify from 'fastify';
import fjwt from '@fastify/jwt';
import fCookie from '@fastify/cookie';
import cors from '@fastify/cors';

declare module 'fastify' {
    export interface FastifyInstance{
        authenticate: any
    }
}

const app = fastify();

app.register(fjwt, {
    secret: 'secret'
});

app.register(fCookie, {
    secret: 'some-secret-key',
    hook: 'onRequest',  // need match the value in endpoint
})

// Register the cors plugin
app.register(cors, {
    // Configurations options
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify which methods are allowed
    allowedHeaders: ["Content-Type", "Authorization"], // Specify which headers are allowed
    credentials: true, // Whether to expose credentials (cookies, authorization headers, etc.)
});

app.decorate('authenticate', async function(request, reply) {
    try {
        const token = request.cookies.access_token;

        if (!token) {
            return reply.status(401).send({message: 'Authentication required'})
        }
        request.user = await app.jwt.verify(token)
    } catch (err) {
        reply.send(err);
    }
});

app.post('/signup', (req, reply) => {
    const token = app.jwt.sign({ "username": "Kuma" });

    // write to cookie in browser
    reply.setCookie('access_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
    })

    reply.send({ token });
});

app.get('/test_signup', (req, reply) => {
    const token = app.jwt.sign({ "username": "Shiba" });

    // write to cookie in browser
    reply.setCookie('access_token', token, {
        path: '/',
        httpOnly: true,
        secure: false,  // true for https
    })

    reply.send({ token });
});

// Check cookies are passed
app.get('/no-login',
    (request, reply) => {
    console.log(request.cookies);
    reply.send({ 'msg': 'done' });
})

app.get('/login', {
    onRequest: [app.authenticate]
}, (request, reply) => {
    console.log(request.user);
    const res_ = 'hi, ' + request.user;
    reply.send({ res_ });
})

app.get('/logout',
    { onRequest: [app.authenticate] },
    (request, reply) => {
    reply.clearCookie('access_token')
    reply.send({ message: 'Logout successful' })
})

app.listen(4000, (err, address) => {
    if (err) throw err;
    console.log(`Server is running at ${address}`);
});
