import { createMachine, createActor, assign} from 'https://cdn.skypack.dev/xstate';

const photographyPageState = {
    id: "photography-page",
    state: {},
}

const aboutPageState = {
    id: "about-page",
    state: {},
}

const blogPostState = {
    id: "blog-post",
    state: {},
}

const blogListState = {
    id: "blog-list",
    initial: "paginating",
    context: {page: 1},
    states: {
        paginating: {
            on: {
                next: {
                    actions: assign({
                        page: ({context}) => context.page + 1
                    })
                },
                previous: {
                    actions: assign({
                        page: ({context}) => context.page - 1
                    })
                }
            }
        },
    },
}

const blogPageState = {
    id: "blog-page",
    initial: "list",
    context: {
        postID: "",
    },
    states: {
        list: {
            invoke: {
                systemId: blogListState.id,
                id: blogListState.id,
                src: createMachine(blogListState),
            },
            on: {
                post: {
                    target: "post",
                    actions: assign({
                        postID: ({event}) => event.postID
                    }),
                }
            }
        },
        post: {
            invoke: {
                systemId: blogPostState.id,
                id: blogPostState.id,
                src: createMachine(blogPostState),
            },
            on: {
                back: {
                    target: "list",
                }
            }
        },
    },
}

const rootState =  {
    id: "root-state",
    initial: "blog",
    states: {
        blog: {
            invoke: {
                systemId: blogPageState.id,
                id: blogPageState.id,
                src: createMachine(blogPageState),
            },
            on: {
                "about": {
                    target: "about",
                },
                "photography": {
                    target: "photography",
                },
            }
        },
        about: {
            invoke: {
                systemId: aboutPageState.id,
                id: aboutPageState.id,
                src: createMachine(aboutPageState),
            },
            on: {
                "blog": {
                    target: "blog",
                },
                "photography": {
                    target: "photography",
                },
            },
        },
       photography: {
            invoke: {
                systemId: photographyPageState.id,
                id: photographyPageState.id,
                src: createMachine(photographyPageState),
            },
            on: {
                "about": {
                    target: "about",
                },
                "blog": {
                    target: "blog",
                },
            },
        },
    },
}


/*
 * options: {
 *  definition: XState::MachineDefinition,
 *  initFunction: (shadowRoot: HTML::ShadowRoot) => {}
 *  updateFunction: (shadowRoot: HTML::ShadowRoot) => {}
 * }
 */
const createRoot = (
    options
) => {
    const machine = createMachine(options.definition);
    const actor = createActor(machine, {systemID: "root-id"});

    customElements.define(
        "app-root",
        class extends HTMLElement {
            constructor() {
                super();
                const template = document.getElementById("app-root-template");
                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.appendChild(template.content.cloneNode(true));
                this._shadowRoot = shadowRoot;

                actor.start();
                this._actor = actor;
            }

            connectedCallback() {
                options.initFunction(this._shadowRoot, this._actor);
                options.updateFunction(this._shadowRoot, this._actor, this);
                this._actor.subscribe(() => {
                    options.updateFunction(this._shadowRoot, this._actor)
                });
                
            }
        },
    );

    return {
        appRoot:actor
    }
}


/*
 * options: {
 *  name: string,
 *  templateID: string,
 *  root: Actor,
 *  actorID: string,
 *  initFunction: (shadowRoot: HTML::ShadowRoot) => {}
 *  updateFunction: (shadowRoot: HTML::ShadowRoot) => {}
 * }
 */
const createElement = (
    options
) => {
    return customElements.define(
        options.name,
        class extends HTMLElement {
            constructor() {
                super();
                const template = document.getElementById(options.templateID);
                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.appendChild(template.content.cloneNode(true));
                this._shadowRoot = shadowRoot;

                const actor = options.root.system.get(options.actorID);

                if (actor === null || actor === undefined) {
                    throw `Actor ${options.actorID} not found`;
                }

                this._actor = actor
            }

            connectedCallback() {
                options.initFunction(this._shadowRoot, this._actor);
                options.updateFunction(this._shadowRoot, this._actor, this);
                this._actor.subscribe(() => {
                    options.updateFunction(this._shadowRoot, this._actor)
                });
                
            }
        },
    );
}

const {appRoot} = createRoot(
    {
        definition: rootState,

        initFunction: (shadowRoot, actor) => {
            const buttons = shadowRoot.querySelectorAll("button")
            Array.from(buttons).forEach((b) => {
                b.onclick = (e) => {
                    actor.send({type: e.target.getAttribute("x-event")});
                };
            });
        },

        updateFunction: (shadowRoot, actor) => {
            const snapshot = actor.getSnapshot();
            const buttons = shadowRoot.querySelectorAll("button")

            Array.from(buttons).forEach((b) => {
                if(b.id === `nav.${snapshot.value}`) {
                    b.classList.add("active");
                } else {
                    b.classList.remove("active");
                }
            });

            const containerEl = shadowRoot.querySelector("#container");

            if (snapshot.value === "blog") {
                containerEl.replaceChildren(
                    document.createElement("blog-page")
                );
            } else if (snapshot.value === "about") {
                containerEl.replaceChildren(
                    document.createElement("about-page")
                );
            } else if (snapshot.value === "photography") {
                containerEl.replaceChildren(
                    document.createElement("photography-page")
                );
            }
        },
    }
)

createElement(
    {
        name: "blog-list",
        templateID: "blog-list-template",
        root: appRoot,
        actorID: "blog-list",
        initFunction: (shadowRoot, actor) => {
            const buttons = shadowRoot.querySelectorAll("button[x-event='post']")
            const blogPageActor = actor.system.get("blog-page");

            Array.from(buttons).forEach((b) => {
                b.addEventListener("click", (el) => {
                    const postID = el.target.getAttribute("x-event-id");
                    blogPageActor.send({
                        type: "post",
                        postID: postID,
                    });
                });
            });
        },
        updateFunction: () => {
        },
    }
)

createElement(
    {
        name: "blog-post",
        templateID: "blog-post-template",
        root: appRoot,
        actorID: "blog-post",
        initFunction: (shadowRoot, actor) => {
            const blogPageActor = actor.system.get("blog-page");
            const button = shadowRoot.querySelector("button[x-event='back']")
            button.addEventListener("click", () => {
                blogPageActor.send({type: "back"});
            });
        },
        updateFunction: (shadowRoot, _actor, el) => {
           const content = shadowRoot.querySelector("p#content"); 
           content.innerHTML = `This is post ${el.postID}`;
        },
    }
)

createElement(
    {
        name: "blog-page",
        templateID: "blog-page-template",
        root: appRoot,
        actorID: "blog-page",
        initFunction: (_shadowRoot) => { },
        updateFunction: (shadowRoot, actor) => {
            const snapshot = actor.getSnapshot();
            const containerEl = shadowRoot.querySelector("#container");
            if (snapshot.value === "list") {
                // Here is the biggest issue
                //
                // Ideally I would attach this click event in the blog-list compponent
                // and then send a message UP the tree. However I don't have a way to
                // reference any kind of event bus, or referential actor that could handle
                // the specific event.
                const blogListEl = document.createElement("blog-list");
                containerEl.replaceChildren(blogListEl);
            } else if (snapshot.value === "post") {
                const blogPostEl = document.createElement("blog-post");
                blogPostEl.postID = snapshot.context.postID;
                containerEl.replaceChildren(blogPostEl);
            }
        },
    }
)

createElement(
    {
        name: "about-page",
        templateID: "about-page-template",
        root: appRoot,
        actorID: "about-page",
        initFunction: () => {
        },
        updateFunction: () => {
        },
    }
)

createElement(
    {
        name: "photography-page",
        templateID: "photography-page-template",
        root: appRoot,
        actorID: "photography-page",
        initFunction: () => {
        },
        updateFunction: () => {
        },
    }
)
