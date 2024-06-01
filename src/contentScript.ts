const waitForElement = (selector: string): Promise<Element | null> => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

const setScreenshotSrc = (img: HTMLImageElement, packageId: string, bookworkCode: string) => {
    chrome.storage.local.get("screenshotURLs", (res) => {
        const screenshotURLs: {[key: string]: {[key: string]: string}} = res.screenshotURLs;
        let screenshotURL;

        if (screenshotURLs instanceof Object && screenshotURLs[packageId]) {
            screenshotURL = screenshotURLs[packageId][bookworkCode];
        }

        img.src = screenshotURL || chrome.runtime.getURL("images/answer_not_found.png");
    });
}

const getPackageId = (url: string): string => {
    const URLDirectories = url.split("/");
    return URLDirectories[URLDirectories.indexOf("package") + 1];
}

chrome.runtime.onMessage.addListener((request) => {
    // When the URL shows a bookwork check, background.js sends a message.
    // Upon receiving it, the answer is displayed.
    if (request.action === "showBookworkAnswer") {
        waitForElement("div._WACContainer_1cxo7_1").then((bookworkContainer) => {
            const bookworkCode = (document.querySelector("div._Chip_bu06u_1") as HTMLDivElement).innerText.split(" ")[1];

            const heading = document.createElement("h2");
            heading.innerText = "Answer: ";

            const screenshot = document.createElement("img");
            screenshot.classList.add("screenshot");

            setScreenshotSrc(screenshot, getPackageId(location.href), bookworkCode);

            const container = document.createElement("div");
            container.style.textAlign = "center";
            container.appendChild(heading);
            container.appendChild(screenshot);

            (bookworkContainer as HTMLDivElement).appendChild(container);

            // If auto next is on, when the submit button is manually clicked, the continue button is clicked.
            chrome.storage.local.get("autoNext", (res) => {
                if (res.autoNext === true) {
                    document.querySelectorAll("button._ButtonBase_nt2r3_1").forEach((submitButton) => {
                        if ((submitButton as HTMLButtonElement).innerText === "Submit") {
                            (submitButton as HTMLButtonElement).addEventListener("click", () => {
                                waitForElement("div._AccuracyText_1gvq7_41").then(() => {
                                    document.querySelectorAll("button._ButtonBase_nt2r3_1").forEach((continueButton) => {
                                        if ((continueButton as HTMLButtonElement).innerText === "Continue") {
                                            (continueButton as HTMLButtonElement).click();
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    }
    // When the URL shows a summary, background.js sends a message.
    // Upon receiving it, if auto next is on, the next task button is clicked.
    else if (request.action === "clickNextTask") {
        chrome.storage.local.get("autoNext", (res) => {
            if (res.autoNext === true) {
                waitForElement("div._SummaryContainer_rlwap_1").then(() => {
                    document.querySelectorAll("a._ButtonBase_nt2r3_1").forEach((element) => {
                        const anchor = element as HTMLAnchorElement;

                        if (anchor.innerText === "Next task" || anchor.innerText === "Continue") {
                            anchor.click();
                        }
                    });
                });
            }
        });
    }
});

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
                const element = node as HTMLElement;

                // Whenever the correct answer popover is displayed, a message is sent to background.js to take a screenshot.
                if (element.matches("div#RESULT_POPOVER") && (element as HTMLDivElement).innerText.includes("Correct!")) {
                    const bookworkCode = (document.querySelector("div._Chip_bu06u_1") as HTMLDivElement).innerText.split(": ")[1];

                    setTimeout(() => {
                        chrome.runtime.sendMessage({ action: "takeScreenshot", packageId: getPackageId(location.href), bookworkCode }, () => {
                            // After the screenshot has been taken, if auto next is on, the continue button is clicked.
                            chrome.storage.local.get("autoNext", (res) => {
                                if (res.autoNext === true) {
                                    const continueButton = document.querySelector("a._ButtonBase_nt2r3_1") as HTMLAnchorElement;

                                    if (continueButton && (continueButton.innerText === "Continue" || continueButton.innerText === "Summary")) {
                                        continueButton.click();
                                    }
                                }
                            });
                        });
                    }, 100);
                }
                // Everytime a new task is started, the homework info (date and type) and package ID are saved.
                else if (element.matches("a._Task_1p2y5_1._TaskClickable_1p2y5_22")) {
                    const anchor = element as HTMLAnchorElement;

                    anchor.addEventListener("click", () => {
                        const homeworkInfo = ((anchor.closest("div._AccordionItem_9fvag_7") as HTMLDivElement).querySelector("div._PackageLeft_s1pvn_28 > span") as HTMLSpanElement).innerText;
                        const packageId = getPackageId(anchor.href);

                        chrome.runtime.sendMessage({ action: "setHomeworkInfos", packageId, homeworkInfo });
                    });
                }
            }
        });
    });
});

const config = {
    childList: true, 
    subtree: true
};  

observer.observe(document.body, config);