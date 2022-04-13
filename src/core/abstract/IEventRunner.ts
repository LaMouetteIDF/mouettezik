import {
  DefaultListener,
  ListenerSignature,
  TypedEmitter,
} from 'tiny-typed-emitter';

export abstract class IEventRunner<
  State,
  Events extends ListenerSignature<Events> = DefaultListener,
> extends TypedEmitter<Events> {
  abstract get state(): State;
}
