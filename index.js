import indexPage from "./src/index.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": indexPage,
    "/puzzles/:id": (req) => new Response(Bun.file(`./docs/puzzles/${req.params.id}`)),
  },
  development: {
    hmr: true,
  },
});

console.log(`server running on ${server.url} 🚀`);
