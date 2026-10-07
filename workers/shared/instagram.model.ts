export type InstagramState = 'ready' | 'unconfigured' | 'unreachable';

/** GET /api/instagram: whether the panel can publish, and to which account. */
export interface InstagramStatus {
  readonly state: InstagramState;
  readonly username: string | null;
}

/** POST /api/instagram/publish: the parked slides in the order they are shown, and the caption. */
export interface PublishRequest {
  readonly slides: readonly string[];
  readonly caption: string;
}

export type PublishFailure =
  | 'bad-request'
  | 'instagram-unconfigured'
  | 'instagram-rejected'
  | 'instagram-slow'
  | 'instagram-uncertain';

/** Why a publication did not go through; `detail` is Instagram's own explanation when it gave one. */
export interface PublishProblem {
  readonly error: PublishFailure;
  readonly detail: string | null;
}
