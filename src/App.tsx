import { useEffect } from "react";

import "./App.css";

function App() {
  const search = () => {
    const packageId = (
      document.querySelector("select#package-id-input") as HTMLSelectElement
    ).value;
    const bookworkCode = (
      document.querySelector("select#bookwork-code-input") as HTMLSelectElement
    ).value;
    const screenshotContainer = document.querySelector(
      "img#screenshot",
    ) as HTMLImageElement;

    chrome.storage.local.get("screenshotURLs", (res) => {
      const screenshotURLs: { [key: string]: { [key: string]: string } } =
        res.screenshotURLs;
      let screenshotURL;

      if (screenshotURLs instanceof Object && screenshotURLs[packageId]) {
        screenshotURL = screenshotURLs[packageId][bookworkCode];
      }

      screenshotContainer.src =
        screenshotURL || chrome.runtime.getURL("images/answer_not_found.png");
    });
  };

  const clear = () => {
    if (
      confirm("Are you sure you want to delete all your answer screenshots?")
    ) {
      chrome.storage.local.set({ screenshotURLs: {}, homeworkInfos: {} });
    }
  };

  const changeBookworkCodeSelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    chrome.storage.local.get("screenshotURLs", (res) => {
      const bookworkCodes = res.screenshotURLs[event.target.value];

      const bookworkCodeInput = document.querySelector(
        "select#bookwork-code-input",
      ) as HTMLSelectElement;
      bookworkCodeInput.replaceChildren(document.createElement("option"));

      for (const bookworkCode in bookworkCodes) {
        const option = document.createElement("option");
        option.value = bookworkCode;
        option.innerText = bookworkCode;
        bookworkCodeInput.appendChild(option);
      }
    });
  };

  const updateAutoNext = () => {
    const autoNext = (
      document.querySelector("input#auto-next") as HTMLInputElement
    ).checked;

    chrome.storage.local.set({ autoNext });
  };

  const openURL = (event: React.MouseEvent<HTMLButtonElement>) => {
    chrome.runtime.sendMessage({
      action: "openURL",
      url: (event.target as HTMLButtonElement).value,
    });
  };

  // Everytime the popup is opened, the date & type select and auto next checkbox are updated.
  useEffect(() => {
    chrome.storage.local.get(
      ["screenshotURLs", "homeworkInfos", "autoNext"],
      (res) => {
        const homeworkInfos: { [key: string]: string } = {};

        if (res.screenshotURLs instanceof Object) {
          for (const packageId in res.screenshotURLs as {
            [key: string]: { [key: string]: string };
          }) {
            homeworkInfos[packageId] = "Unnamed";
          }
        }

        if (res.homeworkInfos instanceof Object) {
          Object.entries(
            res.homeworkInfos as { [key: string]: string },
          ).forEach(([packageId, homeworkInfo]) => {
            if (packageId in homeworkInfos) {
              homeworkInfos[packageId] = homeworkInfo;
            }
          });
        }

        const packageIdInput = document.querySelector(
          "select#package-id-input",
        ) as HTMLSelectElement;
        packageIdInput.replaceChildren(document.createElement("option"));

        Object.entries(homeworkInfos).forEach(([packageId, homeworkInfo]) => {
          const option = document.createElement("option");
          option.value = packageId;
          option.innerText = homeworkInfo;
          packageIdInput.appendChild(option);
        });

        let autoNext: boolean = res.autoNext;

        if (!(typeof autoNext === "boolean")) {
          autoNext = false;
        }

        const autoNextInput = document.querySelector(
          "input#auto-next",
        ) as HTMLInputElement;
        autoNextInput.checked = autoNext;
      },
    );
  });

  return (
    <>
      <h1 className="title">SPARX BOOKWORK TRACKER</h1>

      <div className="input-container">
        <div>
          <label htmlFor="package-id-input">Date & Type</label>
          <select id="package-id-input" onChange={changeBookworkCodeSelect}>
            <option></option>
          </select>

          <label htmlFor="bookwork-code-input">Bookwork code</label>
          <select id="bookwork-code-input" onChange={search}>
            <option></option>
          </select>

          <button onClick={clear}>Clear history</button>
        </div>

        <div>
          <label htmlFor="auto-next" className="tooltip">
            Auto-next
            <span className="tooltip-text">
              Automatically clicks 'next' buttons (i.e. Continue, Next task).
            </span>
          </label>
          <input
            type="checkbox"
            id="auto-next"
            onChange={updateAutoNext}
          ></input>

          <button onClick={openURL} value="https://www.sparxmaths.com/student/">
            Go to Sparx International
          </button>
          <button onClick={openURL} value="https://www.sparxmaths.uk/student/">
            Go to Sparx UK
          </button>
        </div>
      </div>

      <img id="screenshot" className="screenshot"></img>
    </>
  );
}

export default App;
