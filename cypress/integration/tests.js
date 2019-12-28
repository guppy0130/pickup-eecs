Cypress.Screenshot.defaults({
    screenshotOnRunFailure: false
});

describe('Index', function() {
    it('should load index', function() {
        cy.visit('/');
        // ensure there are three links at the bottom
        cy.get('#links > a').should((links) => {
            expect(links).to.have.length(3);
            expect(links.first()).to.contain('About').to.be.visible;
            expect(links.last()).to.contain('Add').to.be.visible;
        });
        // ensure the postcard exists
        cy.get('body').find('.postcard').should('exist').should('be.visible');
        // the postcard should have some text and two inputs
        cy.get('#message > p').should('not.be.empty');
        cy.get('#email-form > label').should((labels) => {
            expect(labels).to.have.length(2);
            expect(labels.first()).to.contain('Your name:');
            expect(labels.last()).to.contain('Their name:');
        });
        cy.get('#email-form > input').should((inputs) => {
            expect(inputs).to.have.length(3);
            // the last input should not be visible, because it selects which line to use.
            expect(inputs.last()).to.not.be.visible;
        });
    });

    it('should have functioning inputs', function() {
        // stub document.execCommand so that we ensure it was called.
        cy.visit('/', {
            onBeforeLoad(win) {
                win.document.execCommand = cy.stub().resolves(Promise.resolve(true)).as('clipboardCheck');
            }
        });
        // add some names
        cy.get('#your').type('Jane Doe');
        cy.get('#their').type('John Doe');
        // the submit button should be visible and clickable
        cy.get('#send-btn').should('be.visible').click();
        // check to see if it's in the clipboard?
        cy.get('@clipboardCheck').should('have.been.calledOnce');
        // and the UI updates
        cy.contains('Copied link to clipboard!');
    });

    it('should show certain text given a shared link', function() {
        cy.visit('/1?theirName=John+Doe&yourName=Jane+Doe');
        // check to see the form fields are filled
        cy.get('#your').should('have.value', 'Jane Doe');
        cy.get('#their').should('have.value', 'John Doe');
        // the submit button should not exist
        cy.get('#send-btn').should('not.exist');
        // and the correct line should be presented
        cy.contains('inductor');
    });
});

describe('About', function() {
    it('navigates to /about', function() {
        cy.visit('/about');
    });
    // dynamic check for VC in case more are added.
    ['Github', 'Gitlab'].forEach((VC) => {
        it(`has a link to ${VC}`, function() {
            cy.contains(VC).should('have.attr', 'href').and('include', `${VC.toLowerCase()}.com/guppy0130/pickup-eecs`);
        });
    });
});

describe('Add', function() {
    it('shows the UI and takes input', function() {
        cy.visit('/add');
        // the labels should exist
        cy.get('form > label').should((inputs) => {
            expect(inputs).to.have.length(2);
            expect(inputs.first()).to.contain('Line');
            expect(inputs.last()).to.contain('Tags (comma separated)');
        });
        // the fields should exist and take content
        cy.get('#msg').type('test input');
        cy.get('#tags').type('test,strings');
        // submitting should update the UI
        cy.get('form').submit();
        cy.contains('Thanks for submitting');
    });

    it('loads that data on /', function() {
        cy.visit('/3');
        cy.contains('test input');
    });

    it('notifies that the line has already been submitted', function() {
        cy.visit('/add');
        cy.get('#msg').type('test input');
        cy.get('#tags').type('test,strings');
        // submitting should update the UI
        cy.get('form').submit();
        cy.contains('Line already exists with those tags, sorry');
    });
});
