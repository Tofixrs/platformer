import { Shape, FixtureProxy } from "planck";

declare module "planck" {
	interface Fixture {
		m_body: Body;
		m_friction: number;
		m_restitution: number;
		m_density: number;
		m_isSensor: boolean;
		m_filterGroupIndex: number;
		m_filterCategoryBits: number;
		m_filterMaskBits: number;
		m_shape: Shape;
		m_next: Fixture | null;
		m_proxies: FixtureProxy[];
		// 0 indicates inactive state, this is not the same as m_proxies.length
		m_proxyCount: number;
		m_userData: unknown;
	}
}
