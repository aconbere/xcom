import { createMachine, createActor } from 'https://cdn.skypack.dev/xstate';

const definition = {
    id: "switch",
    context: { bulb: 'off' },
    initial: "inactive",
    states: {
        inactive: {
            on: {
                toggle: {
                    target: "active",
                },
            },
        },
        active: {
            on: {
                toggle: {
                    target: "inactive",
                },
            },
        },
    },
}

//const lightSwitchMachine = createMachine(definition, options)
const lightSwitchMachine = createMachine(definition)
const lightSwitchActor = createActor(lightSwitchMachine)
lightSwitchActor.start()

customElements.define(
    "light-switch",
    class extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            let template = document.getElementById("light-switch-template");
            let templateContent = template.content;

            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.appendChild(templateContent.cloneNode(true));

            const snapshot = lightSwitchActor.getSnapshot();
            const checkbox = shadowRoot.getElementById("checkbox");
            checkbox.checked = snapshot.matches("active");

            checkbox.addEventListener("change", () => {
                lightSwitchActor.send({type: "toggle"});
            });
        }
    },
);

customElements.define(
    "light-bulb",
    class extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {

            let template = document.getElementById("light-bulb-template");
            let templateContent = template.content;

            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.appendChild(templateContent.cloneNode(true));
            const bulbSVG = shadowRoot.getElementById("bulb")

            const setActive = (snapshot) => {
                if(snapshot.value == "active") {
                    bulbSVG.classList.add("is-activated")
                } else {
                    bulbSVG.classList.remove("is-activated")
                }
            }

            const snapshot = lightSwitchActor.getSnapshot();

            setActive(snapshot)
            lightSwitchActor.subscribe(setActive);
        }
    },
);
