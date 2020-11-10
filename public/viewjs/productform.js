﻿function saveProductPicture(result, location, jsonData)
{
	var productId = Grocy.EditObjectId || result.created_object_id;
	Grocy.Components.UserfieldsForm.Save(() =>
	{
		if (jsonData.hasOwnProperty("picture_file_name") && !Grocy.DeleteProductPictureOnSave)
		{
			Grocy.Api.UploadFile($("#product-picture")[0].files[0], 'productpictures', jsonData.picture_file_name,
				(result) =>
				{
					if (Grocy.ProductEditFormRedirectUri == "reload")
					{
						window.location.reload();
						return
					}

					var returnTo = GetUriParam('returnto');
					if (GetUriParam("closeAfterCreation") !== undefined)
					{
						window.close();
					}
					else if (returnTo !== undefined)
					{
						window.location.href = U(returnTo) + '?createdproduct=' + encodeURIComponent($('#name').val());
					}
					else
					{
						window.location.href = U(location + productId);
					}

				},
				(xhr) =>
				{
					Grocy.FrontendHelpers.EndUiBusy("product-form");
					Grocy.FrontendHelpers.ShowGenericError('Error while saving, probably this item already exists', xhr.response)
				}
			);
		}
		else
		{
			if (Grocy.ProductEditFormRedirectUri == "reload")
			{
				window.location.reload();
				return
			}

			var returnTo = GetUriParam('returnto');
			if (GetUriParam("closeAfterCreation") !== undefined)
			{
				window.close();
			}
			else if (returnTo !== undefined)
			{
				window.location.href = U(returnTo) + '?createdproduct=' + encodeURIComponent($('#name').val());
			}
			else
			{
				window.location.href = U(location + productId);
			}
		}
	});
}

$('.save-product-button').on('click', function(e)
{
	e.preventDefault();

	var jsonData = $('#product-form').serializeJSON({ checkboxUncheckedValue: "0" });
	var parentProductId = jsonData.product_id;
	delete jsonData.product_id;
	jsonData.parent_product_id = parentProductId;
	Grocy.FrontendHelpers.BeginUiBusy("product-form");

	if (jsonData.parent_product_id.toString().isEmpty())
	{
		jsonData.parent_product_id = null;
	}

	if ($("#product-picture")[0].files.length > 0)
	{
		var someRandomStuff = Math.random().toString(36).substring(2, 100) + Math.random().toString(36).substring(2, 100);
		jsonData.picture_file_name = someRandomStuff + $("#product-picture")[0].files[0].name;
	}

	const location = $(e.currentTarget).attr('data-location') == 'return' ? '/products?product=' : '/product/';

	if (Grocy.EditMode == 'create')
	{
		Grocy.Api.Post('objects/products', jsonData,
			(result) => saveProductPicture(result, location, jsonData));
		return;
	}

	if (Grocy.DeleteProductPictureOnSave)
	{
		jsonData.picture_file_name = null;

		Grocy.Api.DeleteFile(Grocy.ProductPictureFileName, 'productpictures', {},
			function(result)
			{
				// Nothing to do
			},
			function(xhr)
			{
				Grocy.FrontendHelpers.EndUiBusy("product-form");
				Grocy.FrontendHelpers.ShowGenericError('Error while saving, probably this item already exists', xhr.response)
			}
		);
	}

	Grocy.Api.Put('objects/products/' + Grocy.EditObjectId, jsonData,
		(result) => saveProductPicture(result, location, jsonData),
		function(xhr)
		{
			Grocy.FrontendHelpers.EndUiBusy("product-form");
			console.error(xhr);
		}
	);
});

Grocy.Api.Get('stock/products/' + Grocy.EditObjectId,
	function(productDetails)
	{
		if (productDetails.last_purchased == null)
		{
			$('#qu_id_stock').removeAttr("disabled");
		}
	},
	function(xhr)
	{
		console.error(xhr);
	}
);

var prefillName = GetUriParam('prefillname');
if (prefillName !== undefined)
{
	$('#name').val(prefillName);
	$('#name').focus();
}

var prefillBarcode = GetUriParam('prefillbarcode');

$('.input-group-qu').on('change', function(e)
{
	var quIdPurchase = $("#qu_id_purchase").val();
	var quIdStock = $("#qu_id_stock").val();
	var factor = $('#qu_factor_purchase_to_stock').val();

	if (factor > 1 || quIdPurchase != quIdStock)
	{
		$('#qu-conversion-info').text(__t('This means 1 %1$s purchased will be converted into %2$s %3$s in stock', $("#qu_id_purchase option:selected").text(), (1 * factor).toString(), __n((1 * factor).toString(), $("#qu_id_stock option:selected").text(), $("#qu_id_stock option:selected").data("plural-form"))));
		$('#qu-conversion-info').removeClass('d-none');
	}
	else
	{
		$('#qu-conversion-info').addClass('d-none');
	}

	$("#tare_weight_qu_info").text($("#qu_id_stock option:selected").text());

	Grocy.FrontendHelpers.ValidateForm('product-form');
});

$('#product-form input').keyup(function(event)
{
	Grocy.FrontendHelpers.ValidateForm('product-form');
	$(".input-group-qu").trigger("change");

	if (document.getElementById('product-form').checkValidity() === false) //There is at least one validation error
	{
		$("#qu-conversion-add-button").addClass("disabled");
	}
	else
	{
		$("#qu-conversion-add-button").removeClass("disabled");
	}
	if (document.getElementById('product-form').checkValidity() === false) //There is at least one validation error
	{
		$("#barcode-add-button").addClass("disabled");
	}
	else
	{
		if (prefillBarcode === undefined)
		{
			$("#barcode-add-button").removeClass("disabled");
		}
	}
});

$('#product-form select').change(function(event)
{
	Grocy.FrontendHelpers.ValidateForm('product-form');

	if (document.getElementById('product-form').checkValidity() === false) //There is at least one validation error
	{
		$("#barcode-add-button").addClass("disabled");
	}
	else
	{
		if (prefillBarcode === undefined)
		{
			$("#barcode-add-button").removeClass("disabled");
		}
	}
	if (document.getElementById('product-form').checkValidity() === false) //There is at least one validation error
	{
		$("#qu-conversion-add-button").addClass("disabled");
	}
	else
	{
		$("#qu-conversion-add-button").removeClass("disabled");
	}
});

$('#location_id').change(function(event)
{
	Grocy.FrontendHelpers.ValidateForm('product-form');
});

$('#product-form input').keydown(function(event)
{
	if (event.keyCode === 13) //Enter
	{
		event.preventDefault();

		if (document.getElementById('product-form').checkValidity() === false) //There is at least one validation error
		{
			return false;
		}
		else
		{
			$('#save-product-button').click();
		}
	}
});

$("#enable_tare_weight_handling").on("click", function()
{
	if (this.checked)
	{
		$("#tare_weight").removeAttr("disabled");
	}
	else
	{
		$("#tare_weight").attr("disabled", "");
	}

	Grocy.FrontendHelpers.ValidateForm("product-form");
});

$("#allow_partial_units_in_stock").on("click", function()
{
	if (this.checked)
	{
		$("#min_stock_amount").attr("min", "0." + "0".repeat(parseInt(Grocy.UserSettings.stock_decimal_places_amounts)));
		$("#min_stock_amount").attr("step", "." + "0".repeat(parseInt(Grocy.UserSettings.stock_decimal_places_amounts) - 1) + "1");
		$("#qu_factor_purchase_to_stock").attr("min", "0." + "0".repeat(parseInt(Grocy.UserSettings.stock_decimal_places_amounts) - 1) + "1");
		$("#qu_factor_purchase_to_stock").attr("step", "." + "0".repeat(parseInt(Grocy.UserSettings.stock_decimal_places_amounts) - 1) + "1");
		$("#qu_factor_purchase_to_stock").parent().find(".invalid-feedback").text(__t('This cannot be lower than %1$s and must be a valid number with max. %2$s decimal places', "0." + "0".repeat(parseInt(Grocy.UserSettings.stock_decimal_places_amounts) - 1) + "1", Grocy.UserSettings.stock_decimal_places_amounts));
	}
	else
	{
		$("#min_stock_amount").attr("min", "0");
		$("#min_stock_amount").attr("step", "1");
		$("#qu_factor_purchase_to_stock").attr("min", "1");
		$("#qu_factor_purchase_to_stock").attr("step", "1");
		$("#qu_factor_purchase_to_stock").parent().find(".invalid-feedback").text(__t('This cannot be lower than %1$s and must be a valid number with max. %2$s decimal places', '1', '0'));
	}

	Grocy.FrontendHelpers.ValidateForm("product-form");
});

$("#product-picture").on("change", function(e)
{
	$("#product-picture-label").removeClass("d-none");
	$("#product-picture-label-none").addClass("d-none");
	$("#delete-current-product-picture-on-save-hint").addClass("d-none");
	$("#current-product-picture").addClass("d-none");
	Grocy.DeleteProductPictureOnSave = false;
});

Grocy.DeleteProductPictureOnSave = false;
$("#delete-current-product-picture-button").on("click", function(e)
{
	Grocy.DeleteProductPictureOnSave = true;
	$("#current-product-picture").addClass("d-none");
	$("#delete-current-product-picture-on-save-hint").removeClass("d-none");
	$("#product-picture-label").addClass("d-none");
	$("#product-picture-label-none").removeClass("d-none");
});

if (Grocy.EditMode === 'create')
{
	if (Grocy.UserSettings.product_presets_location_id.toString() !== '-1')
	{
		$("#location_id").val(Grocy.UserSettings.product_presets_location_id);
	}

	if (Grocy.UserSettings.product_presets_product_group_id.toString() !== '-1')
	{
		$("#product_group_id").val(Grocy.UserSettings.product_presets_product_group_id);
	}

	if (Grocy.UserSettings.product_presets_qu_id.toString() !== '-1')
	{
		$("select.input-group-qu").val(Grocy.UserSettings.product_presets_qu_id);
	}
}

var quConversionsTable = $('#qu-conversions-table').DataTable({
	'order': [[1, 'asc']],
	"orderFixed": [[4, 'asc']],
	'columnDefs': [
		{ 'orderable': false, 'targets': 0 },
		{ 'searchable': false, "targets": 0 },
		{ 'visible': false, 'targets': 4 }
	],
	'rowGroup': {
		dataSrc: 4
	}
});
$('#qu-conversions-table tbody').removeClass("d-none");
quConversionsTable.columns.adjust().draw();

var barcodeTable = $('#barcode-table').DataTable({
	'order': [[1, 'asc']],
	"orderFixed": [[1, 'asc']],
	'columnDefs': [
		{ 'orderable': false, 'targets': 0 },
		{ 'searchable': false, "targets": 0 }
	]
});
$('#barcode-table tbody').removeClass("d-none");
barcodeTable.columns.adjust().draw();
$('.dataTables_scrollBody').addClass("dragscroll");
dragscroll.reset();

Grocy.Components.UserfieldsForm.Load();
$("#name").trigger("keyup");
$('#name').focus();
$('.input-group-qu').trigger('change');
Grocy.FrontendHelpers.ValidateForm('product-form');

// Click twice to trigger on-click but not change the actual checked state
$("#allow_partial_units_in_stock").click();
$("#allow_partial_units_in_stock").click();

$(document).on('click', '.qu-conversion-delete-button', function(e)
{
	var objectId = $(e.currentTarget).attr('data-qu-conversion-id');

	bootbox.confirm({
		message: __t('Are you sure to remove this conversion?'),
		closeButton: false,
		buttons: {
			confirm: {
				label: __t('Yes'),
				className: 'btn-success'
			},
			cancel: {
				label: __t('No'),
				className: 'btn-danger'
			}
		},
		callback: function(result)
		{
			if (result === true)
			{
				Grocy.Api.Delete('objects/quantity_unit_conversions/' + objectId, {},
					function(result)
					{
						Grocy.ProductEditFormRedirectUri = "reload";
						$('#save-product-button').click();
					},
					function(xhr)
					{
						console.error(xhr);
					}
				);
			}
		}
	});
});

$(document).on('click', '.barcode-delete-button', function(e)
{
	var objectId = $(e.currentTarget).attr('data-barcode-id');
	var productId = $(e.currentTarget).attr('data-product-id');
	var barcode = $(e.currentTarget).attr('data-barcode');
	var productBarcode = $(e.currentTarget).attr('data-product-barcode');

	bootbox.confirm({
		message: __t('Are you sure to remove this barcode?'),
		closeButton: false,
		buttons: {
			confirm: {
				label: __t('Yes'),
				className: 'btn-success'
			},
			cancel: {
				label: __t('No'),
				className: 'btn-danger'
			}
		},
		callback: function(result)
		{
			if (result === true)
			{
				Grocy.Api.Delete('objects/product_barcodes/' + objectId, {},
					function(result)
					{
						Grocy.ProductEditFormRedirectUri = "reload";
						$('#save-product-button').click();
					},
					function(xhr)
					{
						console.error(xhr);
					}
				);
			}
		}
	});
});

$('#qu_id_purchase').blur(function(e)
{
	// Preset the stock quantity unit with the purchase quantity unit, if the stock quantity unit is unset.
	var QuIdStock = $('#qu_id_stock');
	var QuIdPurchase = $('#qu_id_purchase');
	if (QuIdStock[0].selectedIndex === 0 && QuIdPurchase[0].selectedIndex !== 0)
	{
		QuIdStock[0].selectedIndex = QuIdPurchase[0].selectedIndex;
		Grocy.FrontendHelpers.ValidateForm('product-form');
	}
});

$(window).on("message", function(e)
{
	var data = e.originalEvent.data;

	if (data.Message === "ProductBarcodesChanged" || data.Message === "ProductQUConversionChanged")
	{
		window.location.reload();
	}
});
