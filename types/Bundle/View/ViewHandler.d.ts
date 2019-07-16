declare namespace Kumis.Bundle.View {
    import EventSubscriberInterface = Jymfony.Contracts.EventDispatcher.EventSubscriberInterface;
    import Engine = Kumis.Bundle.Engine;
    import GetResponseForControllerResultEvent = Jymfony.Component.HttpServer.Event.GetResponseForControllerResultEvent;
    import EventSubscriptions = Jymfony.Contracts.EventDispatcher.EventSubscriptions;

    export class ViewHandler extends implementationOf(EventSubscriberInterface) {
        private _engine: Engine;

        /**
         * Constructor.
         */
        __construct(engine: Engine): void;
        constructor(engine: Engine);

        /**
         * Handles View object returned by controller.
         *
         * @param {Jymfony.Component.HttpServer.Event.GetResponseForControllerResultEvent} event
         */
        onView(event: GetResponseForControllerResultEvent): Promise<void>;

        /**
         * @inheritDoc
         */
        static getSubscribedEvents(): EventSubscriptions;
    }
}
