import { createMachine, createActor, assign} from 'https://cdn.skypack.dev/xstate';


/*
 * options: {
 *  name: string,
 *  templateID: string,
 *  definition: XState::MachineDefinition,
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
                let template = document.getElementById(options.templateID);
                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.appendChild(template.content.cloneNode(true));
                this._shadowRoot = shadowRoot;

                const machine = createMachine(options.definition);
                const actor = createActor(machine);
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
}

createElement(
    {
        name: "nav-header",
        templateID: "nav-header-template",
        definition: {
            id: "nav-header",
            initial: "blog",
            states: {
                blog: {
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
        },
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
                const el = document.createElement("blog-page");
                containerEl.replaceChildren(el);
            } else if (snapshot.value === "about") {
                const el = document.createElement("about-page");
                containerEl.replaceChildren(el);
            } else if (snapshot.value === "photography") {
                const el = document.createElement("photography-page");
                containerEl.replaceChildren(el);
            }
        },
    }
)

createElement(
    {
        name: "blog-list",
        templateID: "blog-list-template",
        definition: {
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
        },
        initFunction: () => {
        },
        updateFunction: () => {
        },
    }
)

createElement(
    {
        name: "blog-post",
        templateID: "blog-post-template",
        definition: {
            id: "blog-post",
        },
        initFunction: () => {
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
        context: {
            postID: "",
        },
        definition: {
            id: "blog",
            initial: "list",
            states: {
                list: {
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
                    on: {
                        back: {
                            target: "list",
                        }
                    }
                },
            },
        },
        initFunction: (_shadowRoot) => {
        },
        updateFunction: (shadowRoot, actor) => {
            const snapshot = actor.getSnapshot();
            const containerEl = shadowRoot.querySelector("#container");
            if (snapshot.value === "list") {
                const blogListEl = document.createElement("blog-list");
                blogListEl.addEventListener("click", (el) => {
                    if (el.originalTarget.getAttribute("x-event") === "post") {
                        const postID = el.originalTarget.getAttribute("x-event-id");
                        actor.send({
                            type: "post",
                            postID: postID,
                        });
                    }
                });
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
        definition: {
            id: "about",
            states: {},
        },
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
        definition: {
            id: "photography",
            states: {},
        },
        initFunction: () => {
        },
        updateFunction: () => {
        },
    }
)
