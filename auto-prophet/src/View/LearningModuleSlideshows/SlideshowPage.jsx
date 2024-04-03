// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React from "react";

function SlideshowPage(props) {
    const content = function() {
        window.fs.fs.readFile()

        return (
            <p>This is where the slide content will go</p>
        );
    };

    return (
        <div className="slideshowPage">
            <h2>{props.page.title}</h2>
            {content()}
        </div>
    );
}

export { SlideshowPage }