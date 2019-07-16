declare namespace Kumis.Bundle.Extension {
    import AuthorizationCheckerInterface = Jymfony.Component.Security.Authorization.AuthorizationCheckerInterface;
    import TokenInterface = Jymfony.Component.Security.Authentication.Token.TokenInterface;
    import TokenStorageInterface = Jymfony.Component.Security.Authentication.Token.Storage.TokenStorageInterface;
    import EventSubscriberInterface = Jymfony.Contracts.EventDispatcher.EventSubscriberInterface;
    import EventSubscriptions = Jymfony.Contracts.EventDispatcher.EventSubscriptions;
    import AbstractExtension = Kumis.Extension.AbstractExtension;

    export class SecurityExtension extends mix(AbstractExtension, EventSubscriberInterface, __jymfony.ClsTrait) {
        private _authorizationChecker: AuthorizationCheckerInterface;
        private _tokenStorage: TokenStorageInterface;

        /**
         * Constructor.
         */
        __construct(authorizationChecker: AuthorizationCheckerInterface, tokenStorage: TokenStorageInterface): void;
        constructor(authorizationChecker: AuthorizationCheckerInterface, tokenStorage: TokenStorageInterface);

        /**
         * @inheritDoc
         */
        public globals(): Record<string, Function>;

        /**
         * Checks if the current user (token) is granted for attributes.
         *
         * @returns {boolean}
         *
         * @private
         */
        _isGranted(token: TokenInterface, attributes: any|any[], subject?: any): boolean;
        _isGranted(attributes: any|any[], subject?: any): boolean;

        /**
         * @inheritdoc
         */
        static getSubscribedEvents(): EventSubscriptions;
    }
}
