/**
 * UserMenu component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getSiteKitAdminURL, clearWebStorage } from '../util';
import Dialog from './dialog';
import Button from './button';
import Menu from './menu';
import Modal from './Modal';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../googlesitekit/datastore/user/constants';
const { withSelect } = Data;

class UserMenu extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			dialogActive: false,
			menuOpen: false,
		};

		this.handleMenu = this.handleMenu.bind( this );
		this.handleMenuClose = this.handleMenuClose.bind( this );
		this.handleMenuItemSelect = this.handleMenuItemSelect.bind( this );
		this.handleDialog = this.handleDialog.bind( this );
		this.handleDialogClose = this.handleDialogClose.bind( this );
		this.handleUnlinkConfirm = this.handleUnlinkConfirm.bind( this );

		this.menuButtonRef = createRef();
		this.menuRef = createRef();
	}

	componentDidMount() {
		global.addEventListener( 'mouseup', this.handleMenuClose );
		global.addEventListener( 'keyup', this.handleMenuClose );
		global.addEventListener( 'keyup', this.handleDialogClose );
	}

	componentWillUnmount() {
		global.removeEventListener( 'mouseup', this.handleMenuClose );
		global.removeEventListener( 'keyup', this.handleMenuClose );
		global.removeEventListener( 'keyup', this.handleDialogClose );
	}

	handleMenu() {
		const { menuOpen } = this.state;
		this.setState( {
			menuOpen: ! menuOpen,
		} );
	}

	handleMenuClose( e ) {
		if (
			( ( 'keyup' === e.type && 27 === e.keyCode ) || 'mouseup' === e.type ) &&
			! this.menuButtonRef.current.buttonRef.current.contains( e.target ) &&
			! this.menuRef.current.menuRef.current.contains( e.target )
		) {
			this.setState( { menuOpen: false } );
		}
	}

	handleMenuItemSelect( index, e ) {
		const { proxyPermissionsURL } = this.props;

		if (
			( ( 'keydown' === e.type && (
				13 === e.keyCode || // Enter
				32 === e.keyCode // Space
			) ) ||
				'click' === e.type // Mouse
			) ) {
			switch ( index ) {
				case 0:
					this.handleDialog();
					break;
				case 1:
					if ( ! proxyPermissionsURL ) {
						return;
					}
					global.location.assign( proxyPermissionsURL );
					break;
				default:
					this.handleMenu();
			}
		}
	}

	handleDialog() {
		this.setState( ( prevState ) => {
			return {
				dialogActive: ! prevState.dialogActive,
				menuOpen: false,
			};
		} );
	}

	handleDialogClose( e ) {
		if ( 27 === e.keyCode ) {
			this.setState( {
				dialogActive: false,
				menuOpen: false,
			} );
		}
	}

	// Log the user out if they confirm the dialog.
	async handleUnlinkConfirm() {
		// Close the modal.
		this.setState( {
			dialogActive: false,
		} );

		// Clear caches.
		clearWebStorage();

		// Navigate back to the splash screen to reconnect.
		document.location = getSiteKitAdminURL(
			'googlesitekit-splash',
			{
				googlesitekit_context: 'revoked',
			}
		);
	}

	render() {
		const {
			proxyPermissionsURL,
			userEmail,
			userPicture,
		} = this.props;
		const { dialogActive, menuOpen } = this.state;

		if ( ! userEmail ) {
			return null;
		}

		return (
			<Fragment>
				<div className="googlesitekit-dropdown-menu mdc-menu-surface--anchor">
					<Button
						ref={ this.menuButtonRef }
						className="googlesitekit-header__dropdown mdc-button--dropdown"
						text
						onClick={ this.handleMenu }
						icon={ userPicture
							? <i className="mdc-button__icon" aria-hidden="true"><img className="mdc-button__icon--image" src={ userPicture } alt={ __( 'User Avatar', 'google-site-kit' ) } /></i>
							: undefined
						}
						ariaHaspopup="menu"
						ariaExpanded={ menuOpen }
						ariaControls="user-menu"
					>
						{ userEmail }
					</Button>
					<Menu
						ref={ this.menuRef }
						menuOpen={ menuOpen }
						menuItems={
							[
								__( 'Disconnect', 'google-site-kit' ),
							].concat(
								proxyPermissionsURL ? [
									__( 'Manage sites…', 'google-site-kit' ),
								] : []
							)
						}
						onSelected={ this.handleMenuItemSelect }
						id="user-menu" />
				</div>
				<Modal>
					<Dialog
						dialogActive={ dialogActive }
						handleConfirm={ this.handleUnlinkConfirm }
						handleDialog={ this.handleDialog }
						title={ __( 'Disconnect', 'google-site-kit' ) }
						subtitle={ __( 'Disconnecting Site Kit by Google will remove your access to all services. After disconnecting, you will need to re-authorize to restore service.', 'google-site-kit' ) }
						confirmButton={ __( 'Disconnect', 'google-site-kit' ) }
						provides={ [] }
						danger
					/>
				</Modal>
			</Fragment>

		);
	}
}

export default withSelect( ( select ) => {
	return {
		proxyPermissionsURL: select( CORE_SITE ).getProxyPermissionsURL(),
		userEmail: select( CORE_USER ).getEmail(),
		userPicture: select( CORE_USER ).getPicture(),
	};
} )( UserMenu );
