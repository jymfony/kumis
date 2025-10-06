const AbstractExtension = Kumis.Extension.AbstractExtension;
const ClsTrait = Jymfony.Contracts.Async.ClsTrait;
const EventSubscriberInterface = Jymfony.Contracts.EventDispatcher.EventSubscriberInterface;
const TokenInterface = Jymfony.Component.Security.Authentication.Token.TokenInterface;

/**
 * @memberOf Kumis.Bundle.Extension
 */
export default class SecurityExtension extends mix(AbstractExtension, EventSubscriberInterface, ClsTrait) {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Security.Authorization.AuthorizationCheckerInterface} authorizationChecker
     * @param {Jymfony.Component.Security.Authentication.Token.Storage.TokenStorageInterface} tokenStorage
     */
    __construct(authorizationChecker, tokenStorage) {
        /**
         * @type {Jymfony.Component.Security.Authorization.AuthorizationCheckerInterface}
         *
         * @private
         */
        this._authorizationChecker = authorizationChecker;

        /**
         * @type {Jymfony.Component.Security.Authentication.Token.Storage.TokenStorageInterface}
         *
         * @private
         */
        this._tokenStorage = tokenStorage;
    }

    /**
     * @inheritDoc
     */
    get globals() {
        if (null === this._authorizationChecker || null === this._tokenStorage) {
            // Security bundle is not registered.
            return {};
        }

        return {
            is_granted: this._isGranted.bind(this),
        }
    }

    /**
     * Checks if the current user (token) is granted for attributes.
     *
     * @returns {boolean}
     *
     * @private
     */
    _isGranted(...args) {
        let token, attributes, subject;
        if (args[0] instanceof TokenInterface) {
            token = args.shift();
        } else {
            const currentRequest = this._activeContext[ClsTrait.REQUEST_SYMBOL];
            if (!! currentRequest) {
                token = this._tokenStorage.getToken(currentRequest);
            }
        }

        if (! token) {
            throw new RuntimeException('Cannot retrieve a security token. Check that you are processing a request that is behind a configured firewall.');
        }

        if (0 === args.length) {
            throw new RuntimeException('Attributes to be checked must be passed to is_granted function.');
        }

        attributes = args.shift();
        subject = args.shift();

        return this._authorizationChecker.isGranted(token, attributes, subject);
    }

    /**
     * @inheritdoc
     */
    static getSubscribedEvents() {
        return {
            'console.command': [ '_onConsoleCommand', 1024 ],
            'console.terminate': [ '_onConsoleTerminate', -1024 ],
            'http.request': [ '_onHttpRequest', 1024 ],
            'http.finish_request': [ '_onHttpFinishRequest', -1024 ],
        };
    }
}
